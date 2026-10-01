// Queries shared by Teacher / Director / Dean screens.
import { prisma } from "@/lib/db";
import { percent } from "@/lib/attendance";
import { ATTENDANCE_THRESHOLD } from "@/lib/constants";

export async function getTeacher(teacherId: string) {
  return prisma.teacher.findUnique({
    where: { id: teacherId },
    include: {
      user: { select: { name: true, phone: true, email: true } },
      department: true,
      proctorOf: true,
      assignments: { include: { subject: true, class: true }, orderBy: [{ classId: "asc" }, { subjectId: "asc" }] },
    },
  });
}
export type TeacherFull = NonNullable<Awaited<ReturnType<typeof getTeacher>>>;

export interface StudentRow {
  id: string;
  name: string;
  rollNo: number;
  parentId: string;
  parentName: string;
  parentPhone: string | null;
  overall: number;
  present: number;
  total: number;
  /** subjectId -> percentage */
  bySubject: Record<string, number>;
}

/** Every student of a class with overall and per-subject attendance. */
export async function classAttendance(classId: string) {
  const [students, subjects, records] = await Promise.all([
    prisma.student.findMany({
      where: { classId },
      orderBy: { rollNo: "asc" },
      include: { user: { select: { name: true } }, parent: { select: { name: true, phone: true } } },
    }),
    prisma.teachingAssignment.findMany({ where: { classId }, include: { subject: true, teacher: { include: { user: { select: { name: true } } } } }, orderBy: { subjectId: "asc" } }),
    prisma.attendanceRecord.findMany({
      where: { session: { assignment: { classId } } },
      select: { studentId: true, status: true, session: { select: { assignment: { select: { subjectId: true } } } } },
    }),
  ]);

  const tally = new Map<string, { p: number; t: number; subj: Map<string, { p: number; t: number }> }>();
  for (const r of records) {
    const e = tally.get(r.studentId) ?? { p: 0, t: 0, subj: new Map() };
    const sid = r.session.assignment.subjectId;
    const s = e.subj.get(sid) ?? { p: 0, t: 0 };
    e.t++;
    s.t++;
    if (r.status === "P") {
      e.p++;
      s.p++;
    }
    e.subj.set(sid, s);
    tally.set(r.studentId, e);
  }

  const rows: StudentRow[] = students.map((st) => {
    const e = tally.get(st.id);
    const bySubject: Record<string, number> = {};
    if (e) for (const [sid, s] of e.subj) bySubject[sid] = percent(s.p, s.t);
    return {
      id: st.id,
      name: st.user.name,
      rollNo: st.rollNo,
      parentId: st.parentId,
      parentName: st.parent.name,
      parentPhone: st.parent.phone,
      overall: e ? percent(e.p, e.t) : 100,
      present: e?.p ?? 0,
      total: e?.t ?? 0,
      bySubject,
    };
  });

  const subjectAvg = subjects.map((a) => {
    let p = 0;
    let t = 0;
    for (const e of tally.values()) {
      const s = e.subj.get(a.subjectId);
      if (s) {
        p += s.p;
        t += s.t;
      }
    }
    return { subjectId: a.subjectId, name: a.subject.name, shortName: a.subject.shortName, teacher: a.teacher.user.name, pct: percent(p, t) };
  });
  const totals = [...tally.values()].reduce((acc, e) => ({ p: acc.p + e.p, t: acc.t + e.t }), { p: 0, t: 0 });

  return {
    rows,
    subjects: subjectAvg,
    overall: percent(totals.p, totals.t),
    low: rows.filter((r) => r.overall < ATTENDANCE_THRESHOLD || Object.values(r.bySubject).some((v) => v < ATTENDANCE_THRESHOLD)),
  };
}
export type ClassAttendance = Awaited<ReturnType<typeof classAttendance>>;

/** Overall attendance % per class (for Director / Dean dashboards). */
export async function attendanceByClass(departmentId?: string) {
  const classes = await prisma.class.findMany({
    where: departmentId ? { departmentId } : {},
    orderBy: { id: "asc" },
    include: { proctor: { include: { user: { select: { name: true } } } }, _count: { select: { students: true } } },
  });
  const out: { id: string; departmentId: string; students: number; proctor: string; pct: number; present: number; total: number }[] = [];
  for (const c of classes) {
    const [p, t] = await Promise.all([
      prisma.attendanceRecord.count({ where: { status: "P", session: { assignment: { classId: c.id } } } }),
      prisma.attendanceRecord.count({ where: { session: { assignment: { classId: c.id } } } }),
    ]);
    out.push({ id: c.id, departmentId: c.departmentId, students: c._count.students, proctor: c.proctor?.user.name ?? "–", pct: percent(p, t), present: p, total: t });
  }
  return out;
}

/** Average % in published/approved assessments per class. */
export async function marksByClass(departmentId?: string) {
  const marks = await prisma.mark.findMany({
    where: { absent: false, assessment: { assignment: departmentId ? { class: { departmentId } } : {} } },
    select: { score: true, assessment: { select: { maxMarks: true, assignment: { select: { classId: true } } } } },
  });
  const by = new Map<string, { got: number; max: number; pass: number; n: number }>();
  for (const m of marks) {
    const k = m.assessment.assignment.classId;
    const e = by.get(k) ?? { got: 0, max: 0, pass: 0, n: 0 };
    e.got += m.score ?? 0;
    e.max += m.assessment.maxMarks;
    e.n++;
    if ((m.score ?? 0) / m.assessment.maxMarks >= 0.4) e.pass++;
    by.set(k, e);
  }
  return by;
}

export async function feeCollection(departmentId?: string) {
  const where = departmentId ? { student: { class: { departmentId } } } : {};
  const [all, paid] = await Promise.all([
    prisma.feeInvoice.aggregate({ where, _sum: { amount: true } }),
    prisma.feeInvoice.aggregate({ where: { ...where, paidAt: { not: null } }, _sum: { amount: true } }),
  ]);
  const total = all._sum.amount ?? 0;
  const got = paid._sum.amount ?? 0;
  return { total, paid: got, pct: total ? percent(got, total) : 100 };
}

export async function upcomingEvents(departmentId: string | null, from: Date, take = 6) {
  return prisma.event.findMany({
    where: { date: { gte: from }, ...(departmentId ? { OR: [{ departmentId: null }, { departmentId }] } : {}) },
    orderBy: { date: "asc" },
    take,
  });
}
