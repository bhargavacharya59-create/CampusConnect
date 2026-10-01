// Read-only queries about one student. Used by the Parent portal now and by
// the Student portal later. Callers must check the viewer is allowed to see
// this student before calling.

import { prisma } from "@/lib/db";
import { PERIODS, WORKING_DAYS } from "@/lib/constants";
import { istMinutesNow, istToday, isoWeekday, toMinutes } from "@/lib/dates";
import { classesCanMiss, classesNeeded, percent } from "@/lib/attendance";

export async function getStudentProfileByParent(parentId: string) {
  return prisma.student.findUnique({
    where: { parentId },
    include: {
      user: { select: { name: true, email: true } },
      parent: { select: { name: true, phone: true, email: true, mustChangePassword: true } },
      class: {
        include: {
          department: { select: { id: true, name: true } },
          proctor: { include: { user: { select: { id: true, name: true, phone: true, email: true } } } },
        },
      },
    },
  });
}
export type StudentProfile = NonNullable<Awaited<ReturnType<typeof getStudentProfileByParent>>>;

export interface SubjectAttendance {
  subjectId: string;
  name: string;
  shortName: string;
  present: number;
  total: number;
  pct: number;
}

export async function getAttendance(studentId: string) {
  const rows = await prisma.attendanceRecord.findMany({
    where: { studentId },
    select: {
      status: true,
      session: {
        select: {
          date: true,
          period: true,
          assignment: { select: { subject: { select: { id: true, name: true, shortName: true } } } },
        },
      },
    },
  });

  const bySubject = new Map<string, SubjectAttendance>();
  const absences: { date: Date; period: number; subject: string }[] = [];
  let present = 0;
  for (const r of rows) {
    const s = r.session.assignment.subject;
    const e = bySubject.get(s.id) ?? { subjectId: s.id, name: s.name, shortName: s.shortName, present: 0, total: 0, pct: 0 };
    e.total++;
    if (r.status === "P") {
      e.present++;
      present++;
    } else {
      absences.push({ date: r.session.date, period: r.session.period, subject: s.name });
    }
    bySubject.set(s.id, e);
  }
  const subjects = [...bySubject.values()]
    .map((e) => ({ ...e, pct: percent(e.present, e.total) }))
    .sort((a, b) => a.subjectId.localeCompare(b.subjectId));
  absences.sort((a, b) => b.date.getTime() - a.date.getTime() || b.period - a.period);

  const total = rows.length;
  return {
    present,
    total,
    pct: percent(present, total),
    needed: classesNeeded(present, total),
    canMiss: classesCanMiss(present, total),
    subjects,
    absences,
  };
}
export type AttendanceSummary = Awaited<ReturnType<typeof getAttendance>>;

export type PeriodStatus = "PRESENT" | "ABSENT" | "NOT_MARKED" | "UPCOMING";

export interface TodayPeriod {
  period: number;
  start: string;
  end: string;
  subject: string;
  teacher: string;
  room: string;
  status: PeriodStatus;
}

/** Today's timetable for the student's class, with attendance status per period. */
export async function getToday(classId: string, studentId: string): Promise<{ date: Date; holiday: boolean; periods: TodayPeriod[] }> {
  const today = istToday();
  const day = isoWeekday(today);
  if (day > WORKING_DAYS) return { date: today, holiday: true, periods: [] };

  const [slots, sessions] = await Promise.all([
    prisma.timetableSlot.findMany({
      where: { classId, day },
      orderBy: { period: "asc" },
      include: {
        assignment: {
          include: {
            subject: { select: { name: true, shortName: true } },
            teacher: { include: { user: { select: { name: true } } } },
          },
        },
      },
    }),
    prisma.attendanceSession.findMany({
      where: { date: today, assignment: { classId } },
      select: { period: true, records: { where: { studentId }, select: { status: true } } },
    }),
  ]);

  const now = istMinutesNow();
  const periods = slots.map((slot): TodayPeriod => {
    const session = sessions.find((s) => s.period === slot.period);
    const time = PERIODS[slot.period];
    let status: PeriodStatus;
    if (session) status = session.records[0]?.status === "A" ? "ABSENT" : "PRESENT";
    else status = now > toMinutes(time.end) ? "NOT_MARKED" : "UPCOMING";
    return {
      period: slot.period,
      start: time.start,
      end: time.end,
      subject: slot.assignment.subject.name,
      teacher: slot.assignment.teacher.user.name,
      room: slot.room,
      status,
    };
  });
  return { date: today, holiday: false, periods };
}

/** Published marks only, with the class average for comparison. */
export async function getPublishedMarks(classId: string, studentId: string) {
  const assessments = await prisma.assessment.findMany({
    where: { status: "PUBLISHED", assignment: { classId } },
    orderBy: [{ heldOn: "desc" }, { assignmentId: "asc" }],
    include: {
      assignment: { include: { subject: { select: { id: true, name: true, shortName: true, isLab: true } } } },
      marks: { where: { studentId }, select: { score: true, absent: true } },
    },
  });
  const averages = await prisma.mark.groupBy({
    by: ["assessmentId"],
    where: { assessmentId: { in: assessments.map((a) => a.id) }, absent: false },
    _avg: { score: true },
    _max: { score: true },
  });
  const avgMap = new Map(averages.map((a) => [a.assessmentId, a]));

  const items = assessments.map((a) => {
    const mine = a.marks[0];
    const agg = avgMap.get(a.id);
    return {
      id: a.id,
      name: a.name,
      heldOn: a.heldOn,
      maxMarks: a.maxMarks,
      subject: a.assignment.subject,
      score: mine?.score ?? null,
      absent: mine?.absent ?? false,
      classAvg: agg?._avg.score != null ? Math.round(agg._avg.score * 10) / 10 : null,
      classHigh: agg?._max.score ?? null,
    };
  });
  const scored = items.filter((i) => i.score != null);
  const got = scored.reduce((s, i) => s + (i.score ?? 0), 0);
  const max = items.reduce((s, i) => s + i.maxMarks, 0);
  return { items, got, max, pct: max ? Math.round((got / max) * 1000) / 10 : null };
}

export async function getFees(studentId: string) {
  const invoices = await prisma.feeInvoice.findMany({ where: { studentId }, orderBy: { dueDate: "asc" } });
  const today = istToday();
  const rows = invoices.map((i) => ({
    ...i,
    state: i.paidAt ? ("PAID" as const) : i.dueDate < today ? ("OVERDUE" as const) : ("DUE" as const),
  }));
  const due = rows.filter((r) => r.state !== "PAID");
  return {
    rows,
    dueTotal: due.reduce((s, r) => s + r.amount, 0),
    paidTotal: rows.filter((r) => r.state === "PAID").reduce((s, r) => s + r.amount, 0),
    nextDue: due.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0] ?? null,
  };
}

export async function getNoticesFor(audience: "PARENTS" | "STUDENTS", departmentId: string, take = 20) {
  return prisma.notice.findMany({
    where: {
      audience: { in: ["ALL", audience] },
      OR: [{ departmentId: null }, { departmentId }],
    },
    orderBy: { createdAt: "desc" },
    take,
    include: { author: { select: { name: true, role: true } } },
  });
}
