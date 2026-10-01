// "Pending work" for each role. Drives the red/light theme:
// RED_THEME_AT (3) or more tasks -> red theme, otherwise light.

import { prisma } from "./db";
import { ATTENDANCE_THRESHOLD, PERIODS, RED_THEME_AT, WORKING_DAYS } from "./constants";
import { addDays, formatDay, istMinutesNow, istToday, isoWeekday, toMinutes } from "./dates";
import { percent } from "./attendance";
import type { Theme } from "@/components/shell/StaffShell";

export interface PendingTask {
  label: string;
  detail?: string;
  href: string;
  overdue?: boolean;
  /** Which sidebar section the task belongs to (for badge counts). */
  area: string;
}

export function themeFor(tasks: PendingTask[]): Theme {
  return tasks.length >= RED_THEME_AT ? "pending" : "clear";
}

export function countByArea(tasks: PendingTask[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of tasks) out[t.area] = (out[t.area] ?? 0) + 1;
  return out;
}

// ---------------- Teacher ----------------

/** Today's periods for a teacher, with whether attendance was taken. */
export async function teacherToday(teacherId: string) {
  const today = istToday();
  const day = isoWeekday(today);
  if (day > WORKING_DAYS) return [];
  const slots = await prisma.timetableSlot.findMany({
    where: { day, assignment: { teacherId } },
    orderBy: { period: "asc" },
    include: { assignment: { include: { subject: true, class: true } } },
  });
  const sessions = await prisma.attendanceSession.findMany({
    where: { date: today, assignmentId: { in: slots.map((s) => s.assignmentId) } },
    select: { assignmentId: true, period: true, _count: { select: { records: true } }, records: { where: { status: "A" }, select: { id: true } } },
  });
  const now = istMinutesNow();
  return slots.map((s) => {
    const session = sessions.find((x) => x.assignmentId === s.assignmentId && x.period === s.period);
    const time = PERIODS[s.period];
    const ended = now > toMinutes(time.end);
    const started = now >= toMinutes(time.start);
    return {
      slotId: s.id,
      assignmentId: s.assignmentId,
      period: s.period,
      start: time.start,
      end: time.end,
      subject: s.assignment.subject.name,
      classId: s.assignment.classId,
      room: s.room,
      taken: !!session,
      absent: session ? session.records.length : 0,
      total: session ? session._count.records : 0,
      state: session ? ("TAKEN" as const) : ended ? ("MISSED" as const) : started ? ("NOW" as const) : ("LATER" as const),
    };
  });
}

export async function teacherPending(teacherId: string): Promise<PendingTask[]> {
  const today = istToday();
  const tasks: PendingTask[] = [];

  for (const p of await teacherToday(teacherId)) {
    if (p.state === "MISSED") {
      tasks.push({
        label: `Take attendance: ${p.subject}`,
        detail: `${p.classId} · ${p.start}–${p.end}`,
        href: `/teacher/attendance?assignment=${p.assignmentId}&period=${p.period}`,
        overdue: true,
        area: "attendance",
      });
    }
  }

  const toReview = await prisma.coursework.findMany({
    where: { assignment: { teacherId }, submissions: { some: { status: { in: ["SUBMITTED", "AI_CHECKED", "AI_FAILED"] } } } },
    include: {
      assignment: { include: { subject: true } },
      _count: { select: { submissions: { where: { status: { in: ["SUBMITTED", "AI_CHECKED", "AI_FAILED"] } } } } },
    },
  });
  for (const c of toReview) {
    tasks.push({
      label: `Review ${c._count.submissions} submissions`,
      detail: `${c.title} · ${c.assignment.subject.name} · ${c.assignment.classId}`,
      href: `/teacher/assignments/${c.id}`,
      area: "assignments",
    });
  }

  const marks = await prisma.assessment.findMany({
    where: { assignment: { teacherId }, status: "DRAFT", heldOn: { lte: today } },
    include: { assignment: { include: { subject: true } } },
  });
  for (const a of marks) {
    tasks.push({
      label: `Submit ${a.name} marks`,
      detail: `${a.assignment.subject.name} · ${a.assignment.classId}${a.reviewNote ? " · sent back by Director" : ""}`,
      href: `/teacher/marks/${a.id}`,
      overdue: !!a.reviewNote,
      area: "marks",
    });
  }

  const unread = await prisma.message.count({ where: { toId: teacherId, readAt: null } });
  if (unread) tasks.push({ label: `Reply to ${unread} parent ${unread === 1 ? "message" : "messages"}`, href: "/teacher/messages", area: "messages" });

  const meetings = await prisma.meetingRequest.count({ where: { teacherId, status: "PENDING" } });
  if (meetings) tasks.push({ label: `Answer ${meetings} meeting ${meetings === 1 ? "request" : "requests"}`, href: "/teacher/messages#meetings", area: "messages" });

  return tasks;
}

// ---------------- Student ----------------

export async function studentPending(studentId: string, classId: string): Promise<PendingTask[]> {
  const today = istToday();
  const tasks: PendingTask[] = [];

  const open = await prisma.coursework.findMany({
    where: {
      assignment: { classId },
      dueDate: { gte: addDays(today, -7) },
      submissions: { none: { studentId, status: { not: "RETURNED" } } },
    },
    include: { assignment: { include: { subject: true } } },
    orderBy: { dueDate: "asc" },
  });
  for (const c of open) {
    const overdue = c.dueDate < today;
    tasks.push({
      label: `${overdue ? "Overdue" : "Submit"}: ${c.title}`,
      detail: `${c.assignment.subject.name} · due ${formatDay(c.dueDate)}`,
      href: `/student/assignments/${c.id}`,
      overdue,
      area: "assignments",
    });
  }

  const rows = await prisma.attendanceRecord.findMany({
    where: { studentId },
    select: { status: true, session: { select: { assignment: { select: { subject: { select: { name: true } } } } } } },
  });
  const by = new Map<string, { p: number; t: number }>();
  for (const r of rows) {
    const k = r.session.assignment.subject.name;
    const e = by.get(k) ?? { p: 0, t: 0 };
    e.t++;
    if (r.status === "P") e.p++;
    by.set(k, e);
  }
  for (const [name, e] of by) {
    const p = percent(e.p, e.t);
    if (p < ATTENDANCE_THRESHOLD) tasks.push({ label: `Attendance low in ${name}`, detail: `${p}% · minimum ${ATTENDANCE_THRESHOLD}%`, href: "/student/attendance", area: "attendance" });
  }

  const fees = await prisma.feeInvoice.findMany({ where: { studentId, paidAt: null, dueDate: { lte: addDays(today, 14) } } });
  for (const f of fees) {
    tasks.push({ label: `Pay ${f.title}`, detail: `due ${formatDay(f.dueDate)}`, href: "/student/fees", overdue: f.dueDate < today, area: "fees" });
  }
  return tasks;
}

// ---------------- Director ----------------

export async function lowAttendanceInDepartment(departmentId: string) {
  const grouped = await prisma.attendanceRecord.groupBy({
    by: ["studentId", "status"],
    where: { student: { class: { departmentId } } },
    _count: { _all: true },
  });
  const by = new Map<string, { p: number; t: number }>();
  for (const g of grouped) {
    const e = by.get(g.studentId) ?? { p: 0, t: 0 };
    e.t += g._count._all;
    if (g.status === "P") e.p += g._count._all;
    by.set(g.studentId, e);
  }
  const low = [...by.entries()].map(([studentId, e]) => ({ studentId, pct: percent(e.p, e.t), present: e.p, total: e.t })).filter((x) => x.pct < ATTENDANCE_THRESHOLD);
  return { low, all: by };
}

/** Parents of low-attendance students who haven't had a message in the last 7 days. */
export async function unnotifiedLowAttendance(departmentId: string) {
  const { low } = await lowAttendanceInDepartment(departmentId);
  if (!low.length) return [];
  const since = addDays(istToday(), -7);
  const recent = await prisma.message.findMany({
    where: { studentId: { in: low.map((l) => l.studentId) }, createdAt: { gte: since }, to: { role: "PARENT" } },
    select: { studentId: true },
  });
  const done = new Set(recent.map((r) => r.studentId));
  return low.filter((l) => !done.has(l.studentId));
}

export async function directorPending(departmentId: string): Promise<PendingTask[]> {
  const tasks: PendingTask[] = [];
  const marks = await prisma.assessment.findMany({
    where: { status: "SUBMITTED", assignment: { class: { departmentId } } },
    include: { assignment: { include: { subject: true, teacher: { include: { user: true } } } } },
  });
  for (const a of marks) {
    tasks.push({ label: `Approve ${a.name} marks`, detail: `${a.assignment.subject.name} · ${a.assignment.classId} · ${a.assignment.teacher.user.name}`, href: "/director/marks", area: "marks" });
  }
  const leaves = await prisma.leaveRequest.findMany({ where: { status: "PENDING", teacher: { departmentId } }, include: { teacher: { include: { user: true } } } });
  for (const l of leaves) {
    tasks.push({ label: `Leave request: ${l.teacher.user.name}`, detail: `${formatDay(l.fromDate)}${l.toDate > l.fromDate ? ` – ${formatDay(l.toDate)}` : ""}`, href: "/director/leave", area: "leave" });
  }
  const unnotified = await unnotifiedLowAttendance(departmentId);
  if (unnotified.length) {
    tasks.push({ label: `Inform parents of ${unnotified.length} low-attendance students`, detail: `below ${ATTENDANCE_THRESHOLD}%, no message in the last 7 days`, href: "/director/attendance", area: "attendance" });
  }
  return tasks;
}

// ---------------- Dean ----------------

export async function deanCounts() {
  const [requests, results] = await Promise.all([
    prisma.deanRequest.count({ where: { status: "PENDING" } }),
    prisma.assessment.count({ where: { status: "DIRECTOR_APPROVED" } }),
  ]);
  return { requests, results };
}
