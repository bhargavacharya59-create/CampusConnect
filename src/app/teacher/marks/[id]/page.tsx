import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { PageHeader, StatusPill } from "@/components/ui";
import { getMe } from "../../data";
import { MarksSheet } from "./MarksSheet";

export const metadata: Metadata = { title: "Enter marks" };

export default async function MarksEntry({ params }: { params: { id: string } }) {
  const { teacher } = await getMe();
  const test = await prisma.assessment.findFirst({
    where: { id: Number(params.id) || -1, assignment: { teacherId: teacher.id } },
    include: { assignment: { include: { subject: true } }, marks: true },
  });
  if (!test) notFound();
  const students = await prisma.student.findMany({ where: { classId: test.assignment.classId }, orderBy: { rollNo: "asc" }, select: { id: true, rollNo: true, user: { select: { name: true } } } });
  const byStudent = new Map<string, (typeof test.marks)[number]>(test.marks.map((m) => [m.studentId, m]));

  return (
    <>
      <PageHeader
        title={`${test.name} · ${test.assignment.subject.name}`}
        subtitle={
          <>
            {test.assignment.classId} · out of {test.maxMarks} · {test.heldOn ? formatDate(test.heldOn) : ""} · <StatusPill status={test.status} /> ·{" "}
            <Link href="/teacher/marks" className="link">
              All tests
            </Link>
          </>
        }
      />
      {test.reviewNote && test.status === "DRAFT" && (
        <div className="rounded-2xl border border-alert-200 bg-alert-100 px-4 py-3 text-sm text-alert-800">
          <b>Sent back by the Director:</b> {test.reviewNote}
        </div>
      )}
      <MarksSheet
        assessmentId={test.id}
        maxMarks={test.maxMarks}
        editable={test.status === "DRAFT"}
        students={students.map((s) => {
          const m = byStudent.get(s.id);
          return { id: s.id, rollNo: s.rollNo, name: s.user.name, score: m?.score != null ? String(m.score) : "", absent: m?.absent ?? false };
        })}
      />
    </>
  );
}
