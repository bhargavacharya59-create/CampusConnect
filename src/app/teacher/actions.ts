"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { LEAVE_KINDS, PERIODS, WORKING_DAYS } from "@/lib/constants";
import { addDays, istMinutesNow, istToday, isoWeekday, parseIsoDate, toMinutes } from "@/lib/dates";
import { aiCheckSubmission, assignmentAiEnabled } from "@/lib/ai/assignment";
import type { FormState } from "@/app/actions/auth";

const me = async () => (await requireRole("TEACHER")).userId;
const refresh = () => revalidatePath("/teacher", "layout");
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

async function ownAssignment(teacherId: string, assignmentId: number) {
  return prisma.teachingAssignment.findFirst({ where: { id: assignmentId, teacherId } });
}

// ---------------- Attendance ----------------

export async function saveAttendance(assignmentId: number, period: number, absentIds: string[]): Promise<FormState> {
  const teacherId = await me();
  const a = await ownAssignment(teacherId, Number(assignmentId));
  if (!a) return { error: "You don't teach this class." };

  const today = istToday();
  const day = isoWeekday(today);
  if (day > WORKING_DAYS) return { error: "Attendance can only be taken on working days." };
  const slot = await prisma.timetableSlot.findFirst({ where: { assignmentId: a.id, day, period: Number(period) } });
  if (!slot) return { error: "This class is not on today's timetable for that period." };
  const time = PERIODS[slot.period];
  if (istMinutesNow() < toMinutes(time.start)) return { error: `This period starts at ${time.start}. Take attendance once the class begins.` };

  const students = await prisma.student.findMany({ where: { classId: a.classId }, select: { id: true } });
  const absent = new Set((Array.isArray(absentIds) ? absentIds : []).map(String));

  await prisma.$transaction(async (tx) => {
    const session = await tx.attendanceSession.upsert({
      where: { assignmentId_date_period: { assignmentId: a.id, date: today, period: slot.period } },
      create: { assignmentId: a.id, date: today, period: slot.period, takenById: teacherId },
      update: { takenById: teacherId },
    });
    await tx.attendanceRecord.deleteMany({ where: { sessionId: session.id } });
    await tx.attendanceRecord.createMany({
      data: students.map((s) => ({ sessionId: session.id, studentId: s.id, status: absent.has(s.id) ? "A" : "P" })),
    });
  });
  refresh();
  return { ok: `Saved: ${students.length - absent.size} present, ${absent.size} absent.` };
}

// ---------------- Marks ----------------

export async function createAssessment(_prev: FormState, f: FormData): Promise<FormState> {
  const teacherId = await me();
  const a = await ownAssignment(teacherId, Number(f.get("assignmentId")));
  if (!a) return { error: "Choose one of your classes." };
  const name = str(f, "name");
  const maxMarks = Number(f.get("maxMarks"));
  const heldOn = parseIsoDate(str(f, "heldOn"));
  if (name.length < 2 || name.length > 40) return { error: "Give the test a short name, e.g. IA-2." };
  if (!Number.isInteger(maxMarks) || maxMarks < 1 || maxMarks > 200) return { error: "Max marks must be a whole number from 1 to 200." };
  if (!heldOn) return { error: "Choose the test date." };
  const exists = await prisma.assessment.findUnique({ where: { assignmentId_name: { assignmentId: a.id, name } } });
  if (exists) return { error: `${name} already exists for this class.` };
  const created = await prisma.assessment.create({ data: { assignmentId: a.id, name, maxMarks, heldOn } });
  refresh();
  redirect(`/teacher/marks/${created.id}`);
}

export interface MarkEntry {
  studentId: string;
  score: string;
  absent: boolean;
}

export async function saveMarks(assessmentId: number, entries: MarkEntry[], submit: boolean): Promise<FormState> {
  const teacherId = await me();
  const as = await prisma.assessment.findFirst({ where: { id: Number(assessmentId), assignment: { teacherId } }, include: { assignment: true } });
  if (!as) return { error: "Test not found." };
  if (as.status !== "DRAFT") return { error: "These marks were already submitted and can no longer be edited." };

  const students = await prisma.student.findMany({ where: { classId: as.assignment.classId }, select: { id: true } });
  const valid = new Set(students.map((s) => s.id));
  const rows: { studentId: string; score: number | null; absent: boolean }[] = [];
  for (const e of Array.isArray(entries) ? entries : []) {
    if (!valid.has(e.studentId)) continue;
    const raw = String(e.score ?? "").trim();
    if (e.absent) {
      rows.push({ studentId: e.studentId, score: null, absent: true });
      continue;
    }
    if (raw === "") {
      rows.push({ studentId: e.studentId, score: null, absent: false });
      continue;
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0 || n > as.maxMarks) return { error: `Marks must be between 0 and ${as.maxMarks} (check ${e.studentId}).` };
    rows.push({ studentId: e.studentId, score: Math.round(n * 2) / 2, absent: false });
  }
  if (submit) {
    const missing = students.length - rows.filter((r) => r.absent || r.score != null).length;
    if (missing > 0) return { error: `Enter marks (or mark absent) for all students before submitting. ${missing} missing.` };
  }

  await prisma.$transaction([
    prisma.mark.deleteMany({ where: { assessmentId: as.id } }),
    prisma.mark.createMany({ data: rows.filter((r) => r.absent || r.score != null).map((r) => ({ ...r, assessmentId: as.id })) }),
    prisma.assessment.update({ where: { id: as.id }, data: submit ? { status: "SUBMITTED", reviewNote: null } : {} }),
  ]);
  refresh();
  return { ok: submit ? "Submitted to the Director for approval." : "Marks saved as draft." };
}

// ---------------- Assignments (homework) ----------------

export async function createCoursework(_prev: FormState, f: FormData): Promise<FormState> {
  const teacherId = await me();
  const a = await ownAssignment(teacherId, Number(f.get("assignmentId")));
  if (!a) return { error: "Choose one of your classes." };
  const title = str(f, "title");
  const instructions = str(f, "instructions");
  const answerKey = str(f, "answerKey");
  const maxMarks = Number(f.get("maxMarks"));
  const dueDate = parseIsoDate(str(f, "dueDate"));
  if (title.length < 2 || title.length > 80) return { error: "Give the assignment a title." };
  if (instructions.length < 10) return { error: "Write the question or instructions (at least 10 characters)." };
  if (instructions.length > 4000 || answerKey.length > 4000) return { error: "Please keep the question and answer key under 4000 characters each." };
  if (!Number.isInteger(maxMarks) || maxMarks < 1 || maxMarks > 100) return { error: "Max marks must be a whole number from 1 to 100." };
  if (!dueDate || dueDate < istToday()) return { error: "Choose a due date from today onwards." };
  const cw = await prisma.coursework.create({ data: { assignmentId: a.id, title, instructions, answerKey: answerKey || null, maxMarks, dueDate } });
  refresh();
  redirect(`/teacher/assignments/${cw.id}`);
}

async function ownSubmission(teacherId: string, submissionId: number) {
  return prisma.submission.findFirst({ where: { id: submissionId, coursework: { assignment: { teacherId } } }, include: { coursework: true } });
}

export async function reviewSubmission(_prev: FormState, f: FormData): Promise<FormState> {
  const teacherId = await me();
  const sub = await ownSubmission(teacherId, Number(f.get("submissionId")));
  if (!sub) return { error: "Submission not found." };
  const decision = str(f, "decision");
  const comment = str(f, "comment").slice(0, 1000) || null;
  if (decision === "return") {
    await prisma.submission.update({ where: { id: sub.id }, data: { status: "RETURNED", teacherComment: comment ?? "Please redo and submit again.", finalScore: null, reviewedAt: new Date() } });
    refresh();
    return { ok: "Returned to the student." };
  }
  const score = Number(str(f, "score"));
  if (str(f, "score") === "" || !Number.isFinite(score) || score < 0 || score > sub.coursework.maxMarks) {
    return { error: `Enter a score between 0 and ${sub.coursework.maxMarks}.` };
  }
  await prisma.submission.update({ where: { id: sub.id }, data: { status: "APPROVED", finalScore: Math.round(score * 2) / 2, teacherComment: comment, reviewedAt: new Date() } });
  refresh();
  return { ok: "Marks approved. The student can now see them." };
}

export async function approveAllAiScores(_prev: FormState, f: FormData): Promise<FormState> {
  const teacherId = await me();
  const id = Number(f.get("courseworkId"));
  const subs = await prisma.submission.findMany({ where: { courseworkId: id, status: "AI_CHECKED", coursework: { assignment: { teacherId } } } });
  for (const s of subs) {
    await prisma.submission.update({ where: { id: s.id }, data: { status: "APPROVED", finalScore: s.aiScore, reviewedAt: new Date() } });
  }
  refresh();
  return { ok: `Approved ${subs.length} AI-checked submissions.` };
}

export async function runAiCheck(_prev: FormState, f: FormData): Promise<FormState> {
  const teacherId = await me();
  if (!assignmentAiEnabled()) return { error: "AI checking is not switched on (GEMINI_KEY_ASSIGNMENT)." };
  const courseworkId = Number(f.get("courseworkId"));
  const subs = await prisma.submission.findMany({
    where: { courseworkId, status: { in: ["SUBMITTED", "AI_FAILED"] }, coursework: { assignment: { teacherId } } },
    select: { id: true },
    take: 10, // keep each click short; press again for more
  });
  if (!subs.length) return { ok: "Nothing left to check." };
  let ok = 0;
  for (const s of subs) if ((await aiCheckSubmission(s.id)).ok) ok++;
  refresh();
  return ok === subs.length ? { ok: `AI checked ${ok} submissions.` } : { error: `AI checked ${ok} of ${subs.length}. Try again for the rest.` };
}

// ---------------- Messages & meetings ----------------

export async function messageParent(_prev: FormState, f: FormData): Promise<FormState> {
  const teacherId = await me();
  const studentId = str(f, "studentId");
  const body = str(f, "body");
  if (!body) return { error: "Type a message first." };
  if (body.length > 1500) return { error: "Please keep the message under 1500 characters." };
  // Allowed if the teacher is the proctor or teaches the student's class.
  const student = await prisma.student.findFirst({
    where: { id: studentId, class: { OR: [{ proctorId: teacherId }, { assignments: { some: { teacherId } } }] } },
    select: { id: true, parentId: true },
  });
  if (!student) return { error: "You can only message parents of students you teach." };
  await prisma.message.create({ data: { fromId: teacherId, toId: student.parentId, studentId: student.id, body } });
  refresh();
  return { ok: "Message sent to the parent." };
}

export async function answerMeeting(_prev: FormState, f: FormData): Promise<FormState> {
  const teacherId = await me();
  const m = await prisma.meetingRequest.findFirst({ where: { id: str(f, "meetingId"), teacherId } });
  if (!m) return { error: "Request not found." };
  const decision = str(f, "decision") === "accept" ? "ACCEPTED" : "DECLINED";
  const reply = str(f, "reply").slice(0, 500) || (decision === "ACCEPTED" ? "Accepted. Please meet me in the department office." : "Sorry, I am not available. Please choose another date.");
  await prisma.meetingRequest.update({ where: { id: m.id }, data: { status: decision, reply } });
  refresh();
  return { ok: decision === "ACCEPTED" ? "Meeting accepted." : "Meeting declined." };
}

// ---------------- Proctor notes ----------------

export async function addMentorNote(_prev: FormState, f: FormData): Promise<FormState> {
  const teacherId = await me();
  const studentId = str(f, "studentId");
  const note = str(f, "note");
  if (note.length < 3) return { error: "Write a short note." };
  if (note.length > 1000) return { error: "Please keep notes under 1000 characters." };
  const student = await prisma.student.findFirst({ where: { id: studentId, class: { proctorId: teacherId } } });
  if (!student) return { error: "Only the proctor can add notes for this student." };
  await prisma.mentorNote.create({ data: { teacherId, studentId, note } });
  revalidatePath(`/teacher/proctor/${studentId}`);
  return { ok: "Note saved." };
}

// ---------------- Leave ----------------

export async function applyLeave(_prev: FormState, f: FormData): Promise<FormState> {
  const teacherId = await me();
  const from = parseIsoDate(str(f, "fromDate"));
  const to = parseIsoDate(str(f, "toDate")) ?? from;
  const kind = str(f, "kind");
  const reason = str(f, "reason");
  if (!from || !to) return { error: "Choose the leave dates." };
  if (to < from) return { error: "The end date is before the start date." };
  if (from < istToday()) return { error: "Leave can't start in the past." };
  if (to > addDays(from, 30)) return { error: "For leave longer than 30 days, contact the Director directly." };
  if (!(kind in LEAVE_KINDS)) return { error: "Choose the type of leave." };
  if (reason.length < 5 || reason.length > 500) return { error: "Give a short reason (5–500 characters)." };
  await prisma.leaveRequest.create({ data: { teacherId, fromDate: from, toDate: to, kind, reason } });
  revalidatePath("/teacher/leave");
  revalidatePath("/director", "layout");
  return { ok: "Leave request sent to your Director." };
}

export async function cancelLeave(_prev: FormState, f: FormData): Promise<FormState> {
  const teacherId = await me();
  const l = await prisma.leaveRequest.findFirst({ where: { id: str(f, "leaveId"), teacherId, status: "PENDING" } });
  if (!l) return { error: "Only pending requests can be cancelled." };
  await prisma.leaveRequest.delete({ where: { id: l.id } });
  revalidatePath("/teacher/leave");
  return { ok: "Request cancelled." };
}
