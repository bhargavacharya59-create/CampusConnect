// At-risk student detection. The rules here are plain maths; the AI
// (GEMINI_KEY_ALERTS) only explains the reasons and suggests actions.
import { prisma } from "./db";
import { percent } from "./attendance";
import { ATTENDANCE_THRESHOLD } from "./constants";
import { addDays, istToday } from "./dates";

export interface RiskCandidate {
  studentId: string;
  name: string;
  classId: string;
  overall: number;
  recent: number; // last 14 days
  marksPct: number | null;
  reasons: string[];
  score: number; // higher = more at risk
}

export async function atRiskStudents(departmentId: string): Promise<RiskCandidate[]> {
  const since = addDays(istToday(), -14);
  const [all, recent, marks, students] = await Promise.all([
    prisma.attendanceRecord.groupBy({ by: ["studentId", "status"], where: { student: { class: { departmentId } } }, _count: { _all: true } }),
    prisma.attendanceRecord.groupBy({ by: ["studentId", "status"], where: { student: { class: { departmentId } }, session: { date: { gte: since } } }, _count: { _all: true } }),
    prisma.mark.findMany({
      where: { student: { class: { departmentId } }, assessment: { status: { in: ["PUBLISHED", "DIRECTOR_APPROVED"] } } },
      select: { studentId: true, score: true, absent: true, assessment: { select: { maxMarks: true } } },
    }),
    prisma.student.findMany({ where: { class: { departmentId } }, select: { id: true, classId: true, user: { select: { name: true } } } }),
  ]);

  const tally = (rows: typeof all) => {
    const m = new Map<string, { p: number; t: number }>();
    for (const g of rows) {
      const e = m.get(g.studentId) ?? { p: 0, t: 0 };
      e.t += g._count._all;
      if (g.status === "P") e.p += g._count._all;
      m.set(g.studentId, e);
    }
    return m;
  };
  const allT = tally(all);
  const recentT = tally(recent);
  const marksT = new Map<string, { got: number; max: number; absent: number }>();
  for (const m of marks) {
    const e = marksT.get(m.studentId) ?? { got: 0, max: 0, absent: 0 };
    if (m.absent) e.absent++;
    else {
      e.got += m.score ?? 0;
      e.max += m.assessment.maxMarks;
    }
    marksT.set(m.studentId, e);
  }

  const out: RiskCandidate[] = [];
  for (const s of students) {
    const a = allT.get(s.id);
    if (!a) continue;
    const overall = percent(a.p, a.t);
    const r = recentT.get(s.id);
    const rec = r && r.t ? percent(r.p, r.t) : overall;
    const mk = marksT.get(s.id);
    const marksPct = mk && mk.max ? percent(mk.got, mk.max) : null;

    const reasons: string[] = [];
    let score = 0;
    if (overall < ATTENDANCE_THRESHOLD) {
      reasons.push(`attendance ${overall}% (below ${ATTENDANCE_THRESHOLD}%)`);
      score += (ATTENDANCE_THRESHOLD - overall) * 2;
    }
    if (rec < overall - 8) {
      reasons.push(`attendance dropped to ${rec}% in the last 2 weeks`);
      score += (overall - rec) * 1.5;
    }
    if (rec < 70 && overall >= ATTENDANCE_THRESHOLD) {
      reasons.push(`only ${rec}% attendance in the last 2 weeks`);
      score += 10;
    }
    if (marksPct != null && marksPct < 45) {
      reasons.push(`low marks (${marksPct}%)`);
      score += (45 - marksPct) * 1.2;
    }
    if (mk && mk.absent > 0) {
      reasons.push(`absent for ${mk.absent} test${mk.absent > 1 ? "s" : ""}`);
      score += 8 * mk.absent;
    }
    if (reasons.length) out.push({ studentId: s.id, name: s.user.name, classId: s.classId, overall, recent: rec, marksPct, reasons, score: Math.round(score) });
  }
  return out.sort((a, b) => b.score - a.score);
}
