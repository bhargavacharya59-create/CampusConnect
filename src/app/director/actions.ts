"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ATTENDANCE_THRESHOLD, COLLEGE_NAME, EVENT_KINDS, REQUEST_KINDS } from "@/lib/constants";
import { istToday, parseIsoDate, weekStart } from "@/lib/dates";
import { unnotifiedLowAttendance } from "@/lib/pending";
import { atRiskStudents } from "@/lib/risk";
import { AiError, generateJson, isAiEnabled } from "@/lib/ai/gemini";
import { takeAiQuota } from "@/lib/ai/limits";
import type { FormState } from "@/app/actions/auth";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

async function me() {
  const session = await requireRole("DIRECTOR");
  const dept = await prisma.department.findFirst({ where: { directorId: session.userId } });
  if (!dept) throw new Error("No department assigned.");
  return { userId: session.userId, dept };
}
const refresh = () => revalidatePath("/director", "layout");

// ---------------- Marks ----------------

export async function decideMarks(_prev: FormState, f: FormData): Promise<FormState> {
  const { dept } = await me();
  const a = await prisma.assessment.findFirst({ where: { id: Number(f.get("assessmentId")), status: "SUBMITTED", assignment: { class: { departmentId: dept.id } } } });
  if (!a) return { error: "These marks are no longer waiting for approval." };
  if (str(f, "decision") === "return") {
    const note = str(f, "note");
    if (note.length < 3) return { error: "Tell the teacher what to correct." };
    await prisma.assessment.update({ where: { id: a.id }, data: { status: "DRAFT", reviewNote: note.slice(0, 500) } });
    refresh();
    revalidatePath("/teacher", "layout");
    return { ok: "Sent back to the teacher." };
  }
  await prisma.assessment.update({ where: { id: a.id }, data: { status: "DIRECTOR_APPROVED", reviewNote: null } });
  refresh();
  revalidatePath("/dean", "layout");
  return { ok: "Approved and sent to the Dean for publishing." };
}

// ---------------- Leave ----------------

export async function decideLeave(_prev: FormState, f: FormData): Promise<FormState> {
  const { userId, dept } = await me();
  const l = await prisma.leaveRequest.findFirst({ where: { id: str(f, "leaveId"), status: "PENDING", teacher: { departmentId: dept.id } } });
  if (!l) return { error: "This request was already decided." };
  const approve = str(f, "decision") === "approve";
  await prisma.leaveRequest.update({
    where: { id: l.id },
    data: { status: approve ? "APPROVED" : "REJECTED", reviewNote: str(f, "note").slice(0, 300) || null, reviewedById: userId, decidedAt: new Date() },
  });
  refresh();
  revalidatePath("/teacher/leave");
  return { ok: approve ? "Leave approved." : "Leave rejected." };
}

// ---------------- Low attendance: inform parents ----------------

function parentMessage(name: string, pct: number, proctor: string, dept: string) {
  return `Dear parent, this is to inform you that ${name}'s attendance is ${pct}%, below the required ${ATTENDANCE_THRESHOLD}%. Students below ${ATTENDANCE_THRESHOLD}% may not be allowed to write the semester exam. Please make sure ${name.split(" ")[0]} attends all classes. For details, contact the proctor, ${proctor}. — Director, ${dept}, ${COLLEGE_NAME}`;
}

export async function notifyParents(_prev: FormState, f: FormData): Promise<FormState> {
  const { userId, dept } = await me();
  const only = str(f, "studentId");
  let targets = await unnotifiedLowAttendance(dept.id);
  if (only) targets = targets.filter((t) => t.studentId === only);
  if (!targets.length) return { ok: "All parents of low-attendance students were already informed this week." };
  const students = await prisma.student.findMany({
    where: { id: { in: targets.map((t) => t.studentId) } },
    select: { id: true, parentId: true, user: { select: { name: true } }, class: { select: { proctor: { select: { user: { select: { name: true } } } } } } },
  });
  const pctOf = new Map(targets.map((t) => [t.studentId, t.pct]));
  await prisma.message.createMany({
    data: students.map((s) => ({
      fromId: userId,
      toId: s.parentId,
      studentId: s.id,
      body: parentMessage(s.user.name, pctOf.get(s.id) ?? 0, s.class.proctor?.user.name ?? "the proctor", dept.name),
    })),
  });
  refresh();
  return { ok: `Informed ${students.length} parent${students.length === 1 ? "" : "s"}. They will see it in their Messages.` };
}

// ---------------- Requests to the Dean ----------------

export async function createDeanRequest(_prev: FormState, f: FormData): Promise<FormState> {
  const { userId, dept } = await me();
  const kind = str(f, "kind");
  const title = str(f, "title");
  const details = str(f, "details");
  const amountRaw = str(f, "amount");
  const amount = amountRaw ? Math.round(Number(amountRaw)) : null;
  if (!(kind in REQUEST_KINDS)) return { error: "Choose the type of request." };
  if (title.length < 3 || title.length > 120) return { error: "Give the request a short title." };
  if (details.length < 10 || details.length > 2000) return { error: "Describe the request (10–2000 characters)." };
  if (amount != null && (!Number.isFinite(amount) || amount < 0 || amount > 100_000_000)) return { error: "Enter a valid amount in rupees." };
  await prisma.deanRequest.create({ data: { departmentId: dept.id, createdById: userId, kind, title, details, amount } });
  revalidatePath("/director/requests");
  revalidatePath("/dean", "layout");
  return { ok: "Request sent to the Dean." };
}

// ---------------- Notices & calendar ----------------

export async function postDeptNotice(_prev: FormState, f: FormData): Promise<FormState> {
  const { userId, dept } = await me();
  const title = str(f, "title");
  const body = str(f, "body");
  const audience = str(f, "audience");
  if (!["ALL", "STUDENTS", "PARENTS", "STAFF"].includes(audience)) return { error: "Choose who should see it." };
  if (title.length < 3 || title.length > 120) return { error: "Add a short title." };
  if (body.length < 5 || body.length > 3000) return { error: "Write the notice (5–3000 characters)." };
  await prisma.notice.create({ data: { title, body, audience, departmentId: dept.id, authorId: userId } });
  revalidatePath("/director/notices");
  return { ok: "Notice posted to your department." };
}

export async function addDeptEvent(_prev: FormState, f: FormData): Promise<FormState> {
  const { userId, dept } = await me();
  const title = str(f, "title");
  const date = parseIsoDate(str(f, "date"));
  const kind = str(f, "kind");
  if (title.length < 3 || title.length > 120) return { error: "Add a title." };
  if (!date) return { error: "Choose a date." };
  if (!(kind in EVENT_KINDS)) return { error: "Choose a type." };
  await prisma.event.create({ data: { title, date, kind, departmentId: dept.id, createdById: userId } });
  revalidatePath("/director/notices");
  return { ok: "Added to the calendar." };
}

export async function deleteDeptEvent(_prev: FormState, f: FormData): Promise<FormState> {
  const { dept } = await me();
  const e = await prisma.event.findFirst({ where: { id: str(f, "eventId"), departmentId: dept.id } });
  if (!e) return { error: "You can only delete your department's events." };
  await prisma.event.delete({ where: { id: e.id } });
  revalidatePath("/director/notices");
  return { ok: "Deleted." };
}

// ---------------- AI at-risk alerts (Gemini key 4) ----------------

interface AiRisk {
  studentId: string;
  risk: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  action: string;
}

export async function runRiskAlerts(_prev: FormState, _f: FormData): Promise<FormState> {
  const { userId, dept } = await me();
  if (!isAiEnabled("ALERTS")) return { error: "AI alerts are not switched on. Add GEMINI_KEY_ALERTS in the .env file." };
  if (!(await takeAiQuota(userId, "ALERTS"))) return { error: "You've reached today's AI limit for alerts." };
  const candidates = (await atRiskStudents(dept.id)).slice(0, 25);
  if (!candidates.length) return { ok: "No students match the risk rules right now." };

  const data = candidates
    .map((c) => `${c.studentId} | ${c.name} | ${c.classId} | overall attendance ${c.overall}% | last 2 weeks ${c.recent}% | marks ${c.marksPct ?? "n/a"}% | flags: ${c.reasons.join("; ")}`)
    .join("\n");
  try {
    const out = await generateJson<{ students: AiRisk[] }>({
      feature: "ALERTS",
      system: `You support the Director of ${dept.name} at ${COLLEGE_NAME} in spotting students at academic risk early.
For each student in the DATA, using ONLY that data, return JSON:
{"students":[{"studentId":"...","risk":"HIGH|MEDIUM|LOW","reason":"one plain sentence explaining the risk","action":"one concrete next step for the proctor or Director"}]}
HIGH = likely to be barred from exams or fail soon; MEDIUM = worrying trend; LOW = watch.`,
      turns: [{ role: "user", parts: [{ text: data }] }],
      temperature: 0.2,
      maxOutputTokens: 3000,
    });
    const valid = new Set(candidates.map((c) => c.studentId));
    const periodStart = weekStart(istToday());
    let n = 0;
    for (const r of out.students ?? []) {
      if (!valid.has(r.studentId)) continue;
      const text = JSON.stringify({ risk: ["HIGH", "MEDIUM", "LOW"].includes(r.risk) ? r.risk : "MEDIUM", reason: String(r.reason ?? "").slice(0, 400), action: String(r.action ?? "").slice(0, 400) });
      await prisma.aiSummary.upsert({
        where: { studentId_kind_periodStart: { studentId: r.studentId, kind: "RISK_ALERT", periodStart } },
        create: { studentId: r.studentId, kind: "RISK_ALERT", periodStart, text },
        update: { text, createdAt: new Date() },
      });
      n++;
    }
    revalidatePath("/director/alerts");
    return { ok: `AI reviewed ${n} students.` };
  } catch (e) {
    console.error("[ai] alerts:", e);
    return { error: e instanceof AiError ? e.userMessage : "Something went wrong. Please try again." };
  }
}
