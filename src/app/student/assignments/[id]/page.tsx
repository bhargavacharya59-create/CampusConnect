import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { addDays, formatDate, formatDateTime, istToday } from "@/lib/dates";
import { assignmentAiEnabled } from "@/lib/ai/assignment";
import { Card, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { getMe } from "../../data";
import { submitHomework } from "../../actions";

export const metadata: Metadata = { title: "Assignment" };

export default async function StudentAssignment({ params }: { params: { id: string } }) {
  const { me } = await getMe();
  const cw = await prisma.coursework.findFirst({
    where: { id: Number(params.id) || -1, assignment: { classId: me.classId } },
    select: {
      id: true,
      title: true,
      instructions: true,
      maxMarks: true,
      dueDate: true,
      assignment: { select: { subject: { select: { name: true } }, teacher: { select: { user: { select: { name: true } } } } } },
      submissions: {
        where: { studentId: me.id },
        select: { id: true, text: true, fileName: true, submittedAt: true, status: true, aiFeedback: true, finalScore: true, teacherComment: true },
      },
    },
  });
  if (!cw) notFound();
  const sub = cw.submissions[0];
  const today = istToday();
  const closed = today > addDays(cw.dueDate, 7);
  const canSubmit = !closed && sub?.status !== "APPROVED";
  const late = today > cw.dueDate;

  return (
    <>
      <PageHeader
        title={cw.title}
        subtitle={
          <>
            {cw.assignment.subject.name} · {cw.assignment.teacher.user.name} · due {formatDate(cw.dueDate)} · out of {cw.maxMarks} ·{" "}
            <Link href="/student/assignments" className="link">
              All assignments
            </Link>
          </>
        }
      />
      <Card title="Question">
        <p className="whitespace-pre-wrap">{cw.instructions}</p>
      </Card>

      {sub && (
        <Card title="Your submission">
          <p className="text-sm text-ink-muted">Submitted {formatDateTime(sub.submittedAt)}</p>
          {sub.text && <p className="mt-2 whitespace-pre-wrap rounded-xl bg-ground p-3 text-sm">{sub.text}</p>}
          {sub.fileName && (
            <a href={`/api/submissions/${sub.id}/file`} target="_blank" rel="noreferrer" className="link mt-2 inline-block text-sm">
              Your file: {sub.fileName}
            </a>
          )}
          {sub.status === "APPROVED" && (
            <div className="mt-3 rounded-xl bg-ok-50 p-3 text-ok-900">
              <div className="text-lg font-extrabold">
                Marks: {sub.finalScore ?? "–"} / {cw.maxMarks}
              </div>
              {sub.teacherComment && <p className="text-sm">Teacher: {sub.teacherComment}</p>}
            </div>
          )}
          {sub.status === "RETURNED" && (
            <div className="mt-3 rounded-xl bg-alert-100 p-3 text-sm text-alert-800">
              <b>Returned by your teacher.</b> {sub.teacherComment} Please submit again below.
            </div>
          )}
          {sub.aiFeedback && sub.status !== "RETURNED" && (
            <div className="mt-3 rounded-xl border border-[#C7D7FE] bg-[#F0F4FF] p-3 text-sm">
              <div className="text-xs font-bold uppercase tracking-wide text-[#1E3A8A]">AI feedback{sub.status !== "APPROVED" ? " · marks will be confirmed by your teacher" : ""}</div>
              <p className="mt-1 whitespace-pre-wrap">{sub.aiFeedback}</p>
            </div>
          )}
          {(sub.status === "SUBMITTED" || sub.status === "AI_FAILED") && <p className="mt-3 text-sm text-ink-muted">Waiting for your teacher to check it.</p>}
        </Card>
      )}

      {canSubmit ? (
        <Card title={sub ? "Submit again" : "Submit your work"}>
          {late && <p className="mb-2 rounded-xl bg-warn-50 px-3 py-2 text-sm font-semibold text-warn-900">The due date has passed. Late work is accepted for 7 days and is shown to the teacher as late.</p>}
          <ActionForm action={submitHomework}>
            <input type="hidden" name="courseworkId" value={cw.id} />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="text" className="label">
                Your answer
              </label>
              <textarea id="text" name="text" rows={8} maxLength={10000} defaultValue={sub?.status === "RETURNED" ? sub.text ?? "" : ""} className="field h-auto py-2.5" placeholder="Type your answer here…" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="file" className="label">
                Or upload a photo or PDF of your written work (max 5 MB)
              </label>
              <input id="file" name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" capture="environment" className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-ground file:px-3 file:py-2 file:font-bold" />
            </div>
            <p className="text-xs text-ink-muted">
              {assignmentAiEnabled() ? "After you submit, AI checks your answer and gives feedback in a few seconds." : "Your teacher will check your answer."} Write in your own words.
            </p>
            <div>
              <SubmitButton busy={assignmentAiEnabled() ? "Submitting and checking…" : "Submitting…"}>{sub ? "Submit again" : "Submit"}</SubmitButton>
            </div>
          </ActionForm>
        </Card>
      ) : (
        !sub && <Card title="Closed">The submission window for this assignment has closed.</Card>
      )}
    </>
  );
}
