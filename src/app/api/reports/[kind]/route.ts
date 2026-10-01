import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { percent } from "@/lib/attendance";
import { ATTENDANCE_THRESHOLD } from "@/lib/constants";
import { istToday } from "@/lib/dates";
import { csvResponse, toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

const day = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");

/**
 * CSV reports. Dean and Office: whole college (or ?dept=CSE).
 * Director: always their own department.
 */
export async function GET(req: Request, { params }: { params: { kind: string } }) {
  const session = await getSession();
  if (!session) return new Response("Please sign in.", { status: 401 });

  let dept: string | null = new URL(req.url).searchParams.get("dept");
  if (session.role === "DIRECTOR") {
    const d = await prisma.department.findFirst({ where: { directorId: session.userId }, select: { id: true } });
    if (!d) return new Response("No department.", { status: 403 });
    dept = d.id;
  } else if (session.role !== "DEAN" && session.role !== "ADMIN") {
    return new Response("Not allowed.", { status: 403 });
  }
  const inDept = dept ? { class: { departmentId: dept } } : {};
  const stamp = `${dept ?? "college"}-${day(istToday())}`;

  switch (params.kind) {
    case "attendance":
    case "low-attendance": {
      const [students, grouped] = await Promise.all([
        prisma.student.findMany({ where: inDept, orderBy: { id: "asc" }, include: { user: true, parent: true, class: { include: { proctor: { include: { user: true } } } } } }),
        prisma.attendanceRecord.groupBy({ by: ["studentId", "status"], where: { student: inDept }, _count: { _all: true } }),
      ]);
      const t = new Map<string, { p: number; t: number }>();
      for (const g of grouped) {
        const e = t.get(g.studentId) ?? { p: 0, t: 0 };
        e.t += g._count._all;
        if (g.status === "P") e.p += g._count._all;
        t.set(g.studentId, e);
      }
      let rows = students.map((s) => {
        const e = t.get(s.id) ?? { p: 0, t: 0 };
        return { s, e, pct: percent(e.p, e.t) };
      });
      if (params.kind === "low-attendance") rows = rows.filter((r) => r.pct < ATTENDANCE_THRESHOLD).sort((a, b) => a.pct - b.pct);
      return csvResponse(
        `${params.kind}-${stamp}.csv`,
        toCsv(
          ["Student ID", "Name", "Class", "Proctor", "Attended", "Held", "Attendance %", "Parent", "Parent phone"],
          rows.map(({ s, e, pct }) => [s.id, s.user.name, s.classId, s.class.proctor?.user.name, e.p, e.t, pct, s.parent.name, s.parent.phone]),
        ),
      );
    }
    case "marks": {
      const marks = await prisma.mark.findMany({
        where: { student: inDept, assessment: { status: "PUBLISHED" } },
        orderBy: [{ studentId: "asc" }],
        include: { student: { include: { user: true } }, assessment: { include: { assignment: { include: { subject: true } } } } },
      });
      return csvResponse(
        `marks-${stamp}.csv`,
        toCsv(
          ["Student ID", "Name", "Class", "Subject", "Test", "Score", "Max", "Absent", "Date"],
          marks.map((m) => [m.studentId, m.student.user.name, m.student.classId, m.assessment.assignment.subject.name, m.assessment.name, m.score, m.assessment.maxMarks, m.absent ? "Yes" : "No", day(m.assessment.heldOn)]),
        ),
      );
    }
    case "fees": {
      const inv = await prisma.feeInvoice.findMany({ where: { student: inDept }, orderBy: [{ studentId: "asc" }, { dueDate: "asc" }], include: { student: { include: { user: true } } } });
      const today = istToday();
      return csvResponse(
        `fees-${stamp}.csv`,
        toCsv(
          ["Student ID", "Name", "Class", "Fee", "Amount", "Due date", "Status", "Paid on", "Receipt", "Mode"],
          inv.map((f) => [f.studentId, f.student.user.name, f.student.classId, f.title, f.amount, day(f.dueDate), f.paidAt ? "Paid" : f.dueDate < today ? "Overdue" : "Due", day(f.paidAt), f.receiptNo, f.mode]),
        ),
      );
    }
    case "staff": {
      const teachers = await prisma.teacher.findMany({
        where: dept ? { departmentId: dept } : {},
        include: { user: true, proctorOf: true, assignments: { include: { subject: true, _count: { select: { slots: true } } } } },
        orderBy: { id: "asc" },
      });
      return csvResponse(
        `staff-${stamp}.csv`,
        toCsv(
          ["ID", "Name", "Department", "Designation", "Proctor of", "Teaches", "Periods per week", "Phone", "Email"],
          teachers.map((t) => [
            t.id,
            t.user.name,
            t.departmentId,
            t.designation,
            t.proctorOf?.id,
            t.assignments.map((a) => `${a.classId} ${a.subject.shortName}`).join("; "),
            t.assignments.reduce((s, a) => s + a._count.slots, 0),
            t.user.phone,
            t.user.email,
          ]),
        ),
      );
    }
    default:
      return new Response("Unknown report.", { status: 404 });
  }
}
