import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/dates";
import { assignmentAiEnabled } from "@/lib/ai/assignment";
import { Card, Empty, Kpi, KpiGrid, PageHeader } from "@/components/ui";
import { ActionForm, InlineAction, SubmitButton } from "@/components/forms";
import { getMe } from "../../data";
import { approveAllAiScores, reviewSubmission, runAiCheck } from "../../actions";

export const metadata: Metadata = { title: "Assignment" };

const STATUS: Record<string, { label: string; cls: string }> = {
  SUBMITTED: { label: "Not checked", cls: "pill-amber" },
  AI_CHECKED: { label: "AI checked: approve", cls: "pill-blue" },
  AI_FAILED: { label: "AI failed: mark manually", cls: "pill-red" },
  APPROVED: { label: "Approved", cls: "pill-green" },
  RETURNED: { label: "Returned", cls: "pill-gray" },
};

export default async function AssignmentDetail({ params, searchParams }: { params: { id: string }; searchParams: { show?: string } }) {
  const { teacher } = await getMe();
  const cw = await prisma.coursework.findFirst({
    where: { id: Number(params.id) || -1, assignment: { teacherId: teacher.id } },
    include: { assignment: { include: { subject: true } } },
  });
  if (!cw) notFound();
  const [subs, classSize] = await Promise.all([
    prisma.submission.findMany({
      where: { courseworkId: cw.id },
      orderBy: [{ status: "asc" }, { submittedAt: "asc" }],
      select: {
        id: true,
        studentId: true,
        text: true,
        fileName: true,
        submittedAt: true,
        status: true,
        aiScore: true,
        aiFeedback: true,
        finalScore: true,
        teacherComment: true,
        student: { select: { rollNo: true, user: { select: { name: true } } } },
      },
    }),
    prisma.student.count({ where: { classId: cw.assignment.classId } }),
  ]);
  const showAll = searchParams.show === "all";
  const waiting = subs.filter((s) => ["SUBMITTED", "AI_CHECKED", "AI_FAILED"].includes(s.status));
  const shown = showAll ? subs : waiting;
  const unchecked = subs.filter((s) => s.status === "SUBMITTED" || s.status === "AI_FAILED").length;
  const aiChecked = subs.filter((s) => s.status === "AI_CHECKED").length;
  const ai = assignmentAiEnabled();

  return (
    <>
      <PageHeader
        title={`${cw.title} · ${cw.assignment.subject.name}`}
        subtitle={
          <>
            {cw.assignment.classId} · due {formatDate(cw.dueDate)} · out of {cw.maxMarks} ·{" "}
            <Link href="/teacher/assignments" className="link">
              All assignments
            </Link>
          </>
        }
        actions={
          <>
            {ai && unchecked > 0 && <InlineAction action={runAiCheck} fields={{ courseworkId: String(cw.id) }} label={`Check ${Math.min(unchecked, 10)} with AI`} busy="AI is checking…" className="btn-outline" />}
            {aiChecked > 0 && (
              <InlineAction
                action={approveAllAiScores}
                fields={{ courseworkId: String(cw.id) }}
                label={`Approve all ${aiChecked} AI scores`}
                busy="Approving…"
                className="btn"
                confirm="Approve the AI's score for every AI-checked submission? Students will see these marks."
              />
            )}
          </>
        }
      />
      <KpiGrid>
        <Kpi label="Submitted" value={`${subs.length}/${classSize}`} />
        <Kpi label="Waiting for you" value={waiting.length} danger={waiting.length > 0} />
        <Kpi label="Approved" value={subs.filter((s) => s.status === "APPROVED").length} />
        <Kpi label="Not submitted" value={classSize - subs.length} />
      </KpiGrid>

      <Card title="Question">
        <p className="whitespace-pre-wrap text-sm">{cw.instructions}</p>
        {cw.answerKey && (
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer font-bold text-ink-muted">Answer key (hidden from students)</summary>
            <p className="mt-1 whitespace-pre-wrap">{cw.answerKey}</p>
          </details>
        )}
      </Card>

      <Card
        title={showAll ? "All submissions" : "Waiting for review"}
        action={
          <Link href={showAll ? `/teacher/assignments/${cw.id}` : `/teacher/assignments/${cw.id}?show=all`} className="link text-sm">
            {showAll ? "Show only waiting" : `Show all ${subs.length}`}
          </Link>
        }
      >
        {shown.length === 0 ? (
          <Empty>{showAll ? "No submissions yet." : "Nothing waiting. All submissions are reviewed."}</Empty>
        ) : (
          <ul className="flex flex-col divide-y divide-line-soft">
            {shown.map((s) => {
              const st = STATUS[s.status] ?? { label: s.status, cls: "pill-gray" };
              const editable = s.status !== "APPROVED";
              return (
                <li key={s.id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-bold">
                        {s.student.rollNo}. {s.student.user.name} <span className="font-mono text-xs font-normal text-ink-muted">{s.studentId}</span>
                      </div>
                      <div className="text-xs text-ink-muted">Submitted {formatDateTime(s.submittedAt)}</div>
                    </div>
                    <span className={`pill ${st.cls}`}>{st.label}</span>
                  </div>
                  {s.text && <p className="mt-2 whitespace-pre-wrap rounded-xl bg-ground p-3 text-sm">{s.text}</p>}
                  {s.fileName && (
                    <a href={`/api/submissions/${s.id}/file`} target="_blank" rel="noreferrer" className="link mt-2 inline-block text-sm">
                      Open uploaded file: {s.fileName}
                    </a>
                  )}
                  {s.aiFeedback && (
                    <div className="mt-2 rounded-xl border border-[#C7D7FE] bg-[#F0F4FF] p-3 text-sm">
                      <div className="text-xs font-bold uppercase tracking-wide text-[#1E3A8A]">AI suggestion: {s.aiScore ?? "–"} / {cw.maxMarks}</div>
                      <p className="mt-1 whitespace-pre-wrap">{s.aiFeedback}</p>
                    </div>
                  )}
                  {editable ? (
                    <ActionForm action={reviewSubmission} className="mt-3 flex flex-wrap items-end gap-2" resetOnSuccess={false}>
                      <input type="hidden" name="submissionId" value={s.id} />
                      <div className="flex flex-col gap-1">
                        <label htmlFor={`score-${s.id}`} className="text-xs font-bold">
                          Final marks /{cw.maxMarks}
                        </label>
                        <input id={`score-${s.id}`} name="score" inputMode="decimal" defaultValue={s.aiScore ?? ""} className="field field-sm w-24" />
                      </div>
                      <div className="flex min-w-[200px] flex-1 flex-col gap-1">
                        <label htmlFor={`comment-${s.id}`} className="text-xs font-bold">
                          Comment for the student (optional)
                        </label>
                        <input id={`comment-${s.id}`} name="comment" defaultValue={s.teacherComment ?? ""} className="field field-sm" />
                      </div>
                      <SubmitButton name="decision" value="approve" className="btn btn-sm h-10">
                        Approve
                      </SubmitButton>
                      <SubmitButton name="decision" value="return" className="btn-outline btn-sm h-10">
                        Return to redo
                      </SubmitButton>
                    </ActionForm>
                  ) : (
                    <p className="mt-2 text-sm">
                      Final: <b>{s.finalScore ?? "–"} / {cw.maxMarks}</b>
                      {s.teacherComment ? ` · ${s.teacherComment}` : ""}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
