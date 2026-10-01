"use server";

import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { istToday, parseIsoDate } from "@/lib/dates";
import { makeStudentId, normalizeId, parentIdFor } from "@/lib/ids";
import type { FormState } from "@/app/actions/auth";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const admin = () => requireRole("ADMIN");

/** Readable one-time password, e.g. EC-482913. */
function tempPassword() {
  return `EC-${randomInt(100000, 999999)}`;
}

const PHONE = /^[6-9]\d{9}$/;
const cleanPhone = (p: string) => p.replace(/[\s-]/g, "").replace(/^\+?91/, "");

// ---------------- Passwords ----------------

export async function resetPassword(_prev: FormState, f: FormData): Promise<FormState> {
  await admin();
  const id = normalizeId(str(f, "userId"));
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { error: "User not found." };
  if (user.role === "ADMIN") return { error: "Office passwords are changed from the Account page." };
  const pw = tempPassword();
  await prisma.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(pw, 10), mustChangePassword: true } });
  return { ok: `New password for ${id}: ${pw}  (share it privately; they should change it after signing in)` };
}

// ---------------- Students ----------------

async function nextRoll(year: number, code: string) {
  const prefix = makeStudentId(year, code, 0).slice(0, -4);
  const last = await prisma.student.findFirst({ where: { id: { startsWith: prefix } }, orderBy: { id: "desc" }, select: { id: true } });
  return last ? Number(last.id.slice(-4)) + 1 : 1;
}

interface NewStudent {
  name: string;
  classId: string;
  parentName: string;
  parentPhone: string;
  email?: string;
  dob?: Date | null;
  year: number;
}

async function createStudent(s: NewStudent, password: string) {
  const cls = await prisma.class.findUnique({ where: { id: s.classId }, include: { department: true, _count: { select: { students: true } } } });
  if (!cls) throw new Error(`Class ${s.classId} does not exist.`);
  const roll = await nextRoll(s.year, cls.department.code);
  if (roll > 9999) throw new Error("Roll numbers are full for this department and year.");
  const id = makeStudentId(s.year, cls.department.code, roll);
  const pid = parentIdFor(id);
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.user.create({ data: { id, role: "STUDENT", name: s.name, email: s.email || null, passwordHash } }),
    prisma.user.create({ data: { id: pid, role: "PARENT", name: s.parentName, phone: s.parentPhone, passwordHash } }),
    prisma.student.create({ data: { id, classId: cls.id, rollNo: roll, admissionYear: s.year, parentId: pid, guardianName: s.parentName, dateOfBirth: s.dob ?? null } }),
  ]);
  return { id, pid };
}

function validateStudent(s: NewStudent): string | null {
  if (s.name.length < 2 || s.name.length > 80) return "Enter the student's full name.";
  if (s.parentName.length < 2 || s.parentName.length > 80) return "Enter the parent's name.";
  if (!PHONE.test(s.parentPhone)) return "Enter a 10-digit Indian mobile number for the parent.";
  if (s.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.email)) return "The email address doesn't look right.";
  if (!Number.isInteger(s.year) || s.year < 2000 || s.year > 2099) return "Admission year must be like 2024.";
  return null;
}

export async function addStudent(_prev: FormState, f: FormData): Promise<FormState> {
  await admin();
  const s: NewStudent = {
    name: str(f, "name"),
    classId: str(f, "classId"),
    parentName: str(f, "parentName"),
    parentPhone: cleanPhone(str(f, "parentPhone")),
    email: str(f, "email"),
    dob: parseIsoDate(str(f, "dob")),
    year: Number(str(f, "year")),
  };
  const err = validateStudent(s);
  if (err) return { error: err };
  const pw = tempPassword();
  try {
    const { id, pid } = await createStudent(s, pw);
    revalidatePath("/admin", "layout");
    return { ok: `Created student ${id} and parent ${pid}. First-time password for both: ${pw}` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create the student." };
  }
}

/** CSV columns: name, class, parent_name, parent_phone, admission_year, dob (yyyy-mm-dd), email */
export async function importStudents(_prev: FormState, f: FormData): Promise<FormState> {
  await admin();
  const file = f.get("file");
  if (!file || typeof file !== "object" || !("text" in file) || file.size === 0) return { error: "Choose a CSV file." };
  if (file.size > 2 * 1024 * 1024) return { error: "The file is too large (max 2 MB, about 10,000 rows)." };
  const text = (await file.text()).replace(/^﻿/, "");
  const rows = parseCsv(text);
  if (rows.length < 2) return { error: "The file has no data rows." };
  const head = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const col = (n: string) => head.indexOf(n);
  for (const need of ["name", "class", "parent_name", "parent_phone"]) if (col(need) < 0) return { error: `Missing column "${need}". Download the template to see the format.` };

  const password = process.env.SEED_DEFAULT_PASSWORD || "Welcome@123";
  const thisYear = istToday().getUTCFullYear();
  let created = 0;
  const errors: string[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.every((c) => !c.trim())) continue;
    const get = (n: string) => (col(n) >= 0 ? (r[col(n)] ?? "").trim() : "");
    const s: NewStudent = {
      name: get("name"),
      classId: get("class").toUpperCase(),
      parentName: get("parent_name"),
      parentPhone: cleanPhone(get("parent_phone")),
      email: get("email"),
      dob: parseIsoDate(get("dob")),
      year: Number(get("admission_year") || thisYear),
    };
    const err = validateStudent(s);
    if (err) {
      errors.push(`Row ${i + 1}: ${err}`);
      continue;
    }
    try {
      await createStudent(s, password);
      created++;
    } catch (e) {
      errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }
  revalidatePath("/admin", "layout");
  const msg = `Imported ${created} students (with parent logins). Password for all new accounts: ${password}.`;
  return errors.length ? { error: `${msg} ${errors.length} rows skipped: ${errors.slice(0, 8).join(" · ")}${errors.length > 8 ? " …" : ""}` } : { ok: msg };
}

/** Small CSV parser that handles quoted fields with commas and quotes. */
function parseCsv(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      out.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    out.push(row);
  }
  return out;
}

// ---------------- Staff ----------------

const PREFIX: Record<string, string> = { TEACHER: "TCH", DIRECTOR: "DIR", DEAN: "DEAN", ADMIN: "ADMIN" };

export async function addStaff(_prev: FormState, f: FormData): Promise<FormState> {
  await admin();
  const role = str(f, "role");
  const name = str(f, "name");
  const phone = cleanPhone(str(f, "phone"));
  const email = str(f, "email");
  const departmentId = str(f, "departmentId");
  const designation = str(f, "designation") || "Assistant Professor";
  if (!(role in PREFIX)) return { error: "Choose a role." };
  if (name.length < 3 || name.length > 80) return { error: "Enter the full name, e.g. Prof. Asha Rao." };
  if (phone && !PHONE.test(phone)) return { error: "Enter a 10-digit mobile number." };
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "The email address doesn't look right." };
  if (role === "TEACHER" && !(await prisma.department.findUnique({ where: { id: departmentId } }))) return { error: "Choose the teacher's department." };

  const prefix = PREFIX[role];
  const last = await prisma.user.findFirst({ where: { id: { startsWith: `${prefix}-` } }, orderBy: { id: "desc" }, select: { id: true } });
  const id = `${prefix}-${String((last ? Number(last.id.split("-")[1]) : 0) + 1).padStart(4, "0")}`;
  const pw = tempPassword();
  const passwordHash = await bcrypt.hash(pw, 10);
  await prisma.$transaction([
    prisma.user.create({ data: { id, role, name, phone: phone || null, email: email || null, passwordHash } }),
    ...(role === "TEACHER" ? [prisma.teacher.create({ data: { id, departmentId, designation } })] : []),
  ]);
  revalidatePath("/admin", "layout");
  return { ok: `Created ${id} (${name}). First-time password: ${pw}` };
}

// ---------------- Classes ----------------

export async function setProctor(_prev: FormState, f: FormData): Promise<FormState> {
  await admin();
  const classId = str(f, "classId");
  const teacherId = str(f, "teacherId") || null;
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) return { error: "Class not found." };
  if (teacherId) {
    const t = await prisma.teacher.findUnique({ where: { id: teacherId }, include: { proctorOf: true } });
    if (!t) return { error: "Teacher not found." };
    if (t.proctorOf && t.proctorOf.id !== classId) return { error: `${teacherId} is already proctor of ${t.proctorOf.id}. Change that class first.` };
  }
  await prisma.class.update({ where: { id: classId }, data: { proctorId: teacherId } });
  revalidatePath("/admin/classes");
  return { ok: `Proctor of ${classId} updated.` };
}

export async function setSubjectTeacher(_prev: FormState, f: FormData): Promise<FormState> {
  await admin();
  const id = Number(f.get("assignmentId"));
  const teacherId = str(f, "teacherId");
  const a = await prisma.teachingAssignment.findUnique({ where: { id } });
  if (!a) return { error: "Not found." };
  if (!(await prisma.teacher.findUnique({ where: { id: teacherId } }))) return { error: "Teacher not found." };
  // Refuse if the new teacher already teaches at any of this subject's periods.
  const slots = await prisma.timetableSlot.findMany({ where: { assignmentId: id }, select: { day: true, period: true } });
  const clash = await prisma.timetableSlot.findFirst({
    where: { assignment: { teacherId, NOT: { id } }, OR: slots.map((s) => ({ day: s.day, period: s.period })) },
    include: { assignment: true },
  });
  if (clash) return { error: `Clash: ${teacherId} already teaches ${clash.assignment.classId} at that time (day ${clash.day}, period ${clash.period}).` };
  await prisma.teachingAssignment.update({ where: { id }, data: { teacherId } });
  revalidatePath("/admin/classes");
  return { ok: "Subject teacher updated." };
}

// ---------------- Fees ----------------

export async function recordPayment(_prev: FormState, f: FormData): Promise<FormState> {
  await admin();
  const id = Number(f.get("invoiceId"));
  const mode = str(f, "mode");
  if (!["CASH", "UPI", "CARD", "BANK"].includes(mode)) return { error: "Choose how it was paid." };
  const inv = await prisma.feeInvoice.findUnique({ where: { id } });
  if (!inv) return { error: "Fee item not found." };
  if (inv.paidAt) return { error: "Already paid." };
  const year = istToday().getUTCFullYear();
  const last = await prisma.feeInvoice.findFirst({ where: { receiptNo: { startsWith: `ECR-${year}-` } }, orderBy: { receiptNo: "desc" }, select: { receiptNo: true } });
  const next = (last?.receiptNo ? Number(last.receiptNo.split("-")[2]) : 1000) + 1;
  const receiptNo = `ECR-${year}-${String(next).padStart(5, "0")}`;
  await prisma.feeInvoice.update({ where: { id }, data: { paidAt: istToday(), mode, receiptNo } });
  revalidatePath("/admin/fees");
  return { ok: `Payment recorded. Receipt ${receiptNo}.` };
}

export async function addFeeForClass(_prev: FormState, f: FormData): Promise<FormState> {
  await admin();
  const scope = str(f, "scope"); // ALL | dept id | class id
  const title = str(f, "title");
  const amount = Math.round(Number(str(f, "amount")));
  const dueDate = parseIsoDate(str(f, "dueDate"));
  if (title.length < 3 || title.length > 100) return { error: "Enter the fee name." };
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) return { error: "Enter the amount in rupees." };
  if (!dueDate) return { error: "Choose the due date." };
  const where = scope === "ALL" ? {} : scope.includes("-") ? { classId: scope } : { class: { departmentId: scope } };
  const students = await prisma.student.findMany({ where, select: { id: true } });
  if (!students.length) return { error: "No students in that group." };
  await prisma.feeInvoice.createMany({ data: students.map((s) => ({ studentId: s.id, title, amount, dueDate })) });
  revalidatePath("/admin/fees");
  return { ok: `Added "${title}" for ${students.length} students.` };
}

// ---------------- Timetable ----------------

/** Replaces a class's weekly timetable. Fields: cell-<day>-<period> = assignmentId or "" (free). */
export async function saveTimetable(_prev: FormState, f: FormData): Promise<FormState> {
  await admin();
  const classId = str(f, "classId");
  const cls = await prisma.class.findUnique({ where: { id: classId }, include: { assignments: { include: { subject: true } }, slots: true } });
  if (!cls) return { error: "Class not found." };
  const own = new Map<number, (typeof cls.assignments)[number]>(cls.assignments.map((a) => [a.id, a]));
  const roomOf = (isLab: boolean) => cls.slots.find((s) => (own.get(s.assignmentId)?.subject.isLab ?? false) === isLab)?.room ?? (isLab ? "Lab" : `Room ${cls.id}`);

  const wanted: { day: number; period: number; assignmentId: number }[] = [];
  for (const [k, v] of f.entries()) {
    const m = /^cell-(\d)-(\d)$/.exec(k);
    if (!m || !String(v)) continue;
    const a = own.get(Number(v));
    if (!a) return { error: "Choose subjects from this class only." };
    wanted.push({ day: Number(m[1]), period: Number(m[2]), assignmentId: a.id });
  }

  // A teacher can't be in two classes at once.
  for (const w of wanted) {
    const teacherId = own.get(w.assignmentId)!.teacherId;
    const clash = await prisma.timetableSlot.findFirst({
      where: { day: w.day, period: w.period, classId: { not: classId }, assignment: { teacherId } },
      include: { assignment: { include: { teacher: { include: { user: true } } } } },
    });
    if (clash) return { error: `Clash: ${clash.assignment.teacher.user.name} already teaches ${clash.classId} on day ${w.day}, period ${w.period}.` };
  }

  await prisma.$transaction([
    prisma.timetableSlot.deleteMany({ where: { classId } }),
    prisma.timetableSlot.createMany({
      data: wanted.map((w) => ({ classId, day: w.day, period: w.period, assignmentId: w.assignmentId, room: roomOf(own.get(w.assignmentId)!.subject.isLab) })),
    }),
  ]);
  revalidatePath("/admin/timetable");
  return { ok: `Timetable for ${classId} saved (${wanted.length} periods a week).` };
}
