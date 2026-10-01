import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

/** Assessments with summary statistics, for approval screens. */
export async function assessmentsWithStats(where: Prisma.AssessmentWhereInput) {
  const list = await prisma.assessment.findMany({
    where,
    orderBy: [{ heldOn: "desc" }, { id: "asc" }],
    include: {
      assignment: { include: { subject: true, class: true, teacher: { include: { user: { select: { name: true } } } } } },
      marks: { select: { score: true, absent: true } },
    },
  });
  return list.map((a) => {
    const scored = a.marks.filter((m) => !m.absent && m.score != null).map((m) => m.score as number);
    const avg = scored.length ? scored.reduce((x, y) => x + y, 0) / scored.length : null;
    return {
      id: a.id,
      name: a.name,
      status: a.status,
      maxMarks: a.maxMarks,
      heldOn: a.heldOn,
      classId: a.assignment.classId,
      departmentId: a.assignment.class.departmentId,
      subject: a.assignment.subject.name,
      teacher: a.assignment.teacher.user.name,
      entered: a.marks.length,
      absent: a.marks.filter((m) => m.absent).length,
      avg: avg != null ? Math.round(avg * 10) / 10 : null,
      high: scored.length ? Math.max(...scored) : null,
      low: scored.length ? Math.min(...scored) : null,
      passPct: scored.length ? Math.round((scored.filter((s) => s / a.maxMarks >= 0.4).length / scored.length) * 1000) / 10 : null,
    };
  });
}
export type AssessmentStat = Awaited<ReturnType<typeof assessmentsWithStats>>[number];
