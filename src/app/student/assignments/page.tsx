import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDay, istToday } from "@/lib/dates";
import { Card, Empty, PageHeader } from "@/components/ui";
import { getMe } from "../data";

export const metadata: Metadata = { title: "Assignments" };

function submissionLabel(status: string | undefined, overdue: boolean) {
  if (!status) return overdue ? { label: "Missed", cls: "pill-red" } : { label: "To do", cls: "pill-amber" };
  if (status === "RETURNED") return { label: "Redo", cls: "pill-red" };
  if (status === "APPROVED") return { label: "Marked", cls: "pill-green" };
  if (status === "AI_CHECKED") return { label: "AI checked", cls: "pill-blue" };
  return { label: "Submitted", cls: "pill-gray" };
}

export default async function StudentAssignments() {
  const { me } = await getMe();
  const today = istToday();
  const list = await prisma.coursework.findMany({
    where: { assignment: { classId: me.classId } },
    orderBy: { dueDate: "desc" },
    include: { assignment: { include: { subject: true } }, submissions: { where: { studentId: me.id }, select: { status: true, finalScore: true } } },
  });
  const open = list.filter((c) => !c.submissions[0] || c.submissions[0].status === "RETURNED");
  const done = list.filter((c) => c.submissions[0] && c.submissions[0].status !== "RETURNED");

  const Row = ({ c }: { c: (typeof list)[number] }) => {
    const s = c.submissions[0];
    const st = submissionLabel(s?.status, c.dueDate < today);
    return (
      <Link href={`/student/assignments/${c.id}`} className="row hover:bg-ground">
        <span className="min-w-0">
          <span className="block font-bold">{c.title}</span>
          <span className="block text-xs text-ink-muted">
            {c.assignment.subject.name} · due {formatDay(c.dueDate)}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {s?.status === "APPROVED" && (
            <b>
              {s.finalScore ?? "–"}/{c.maxMarks}
            </b>
          )}
          <span className={`pill ${st.cls}`}>{st.label}</span>
        </span>
      </Link>
    );
  };

  return (
    <>
      <PageHeader title="Assignments" subtitle="Type your answer or upload a photo/PDF of your work. AI gives quick feedback; your teacher confirms the marks." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={`To do (${open.length})`}>{open.length === 0 ? <Empty>Nothing to do. Well done!</Empty> : open.map((c) => <Row key={c.id} c={c} />)}</Card>
        <Card title={`Submitted (${done.length})`}>{done.length === 0 ? <Empty>No submissions yet.</Empty> : done.map((c) => <Row key={c.id} c={c} />)}</Card>
      </div>
    </>
  );
}
