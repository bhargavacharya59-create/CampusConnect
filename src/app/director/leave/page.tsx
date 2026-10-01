import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { LEAVE_KINDS } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/dates";
import { Card, Empty, PageHeader, StatusPill } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { getDept } from "../data";
import { decideLeave } from "../actions";

export const metadata: Metadata = { title: "Leave requests" };

export default async function DirectorLeave() {
  const { dept } = await getDept();
  const all = await prisma.leaveRequest.findMany({
    where: { teacher: { departmentId: dept.id } },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: { teacher: { include: { user: { select: { name: true } }, assignments: { select: { classId: true }, distinct: ["classId"] } } } },
  });
  const pending = all.filter((l) => l.status === "PENDING");
  const done = all.filter((l) => l.status !== "PENDING");
  const kind = (k: string) => LEAVE_KINDS[k as keyof typeof LEAVE_KINDS] ?? k;
  const days = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1;

  return (
    <>
      <PageHeader title="Leave requests" subtitle={`Teachers of ${dept.name}`} />
      <Card title={`Waiting (${pending.length})`}>
        {pending.length === 0 ? (
          <Empty>No leave requests waiting.</Empty>
        ) : (
          pending.map((l) => (
            <div key={l.id} className="border-b border-line-soft py-4 last:border-b-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-extrabold">{l.teacher.user.name}</div>
                  <div className="text-sm">
                    {formatDate(l.fromDate)}
                    {l.toDate > l.fromDate ? ` – ${formatDate(l.toDate)}` : ""} · {days(l.fromDate, l.toDate)} day{days(l.fromDate, l.toDate) > 1 ? "s" : ""} · {kind(l.kind)}
                  </div>
                  <div className="text-sm text-ink-muted">{l.reason}</div>
                  <div className="mt-1 text-xs text-ink-muted">
                    Teaches {l.teacher.assignments.map((a) => a.classId).join(", ")} · asked {formatDateTime(l.createdAt)}
                  </div>
                </div>
                <StatusPill status={l.status} />
              </div>
              <ActionForm action={decideLeave} className="mt-3 flex flex-wrap items-end gap-2">
                <input type="hidden" name="leaveId" value={l.id} />
                <div className="flex min-w-[220px] flex-1 flex-col gap-1">
                  <label htmlFor={`n-${l.id}`} className="text-xs font-bold">
                    Note (optional), e.g. substitute arrangement
                  </label>
                  <input id={`n-${l.id}`} name="note" className="field field-sm" />
                </div>
                <SubmitButton name="decision" value="approve" className="btn btn-sm h-10">
                  Approve
                </SubmitButton>
                <SubmitButton name="decision" value="reject" className="btn-outline btn-sm h-10">
                  Reject
                </SubmitButton>
              </ActionForm>
            </div>
          ))
        )}
      </Card>
      <Card title="History">
        {done.length === 0 ? (
          <Empty>No decided requests yet.</Empty>
        ) : (
          done.map((l) => (
            <div key={l.id} className="row">
              <span>
                <b>{l.teacher.user.name}</b> · {formatDate(l.fromDate)}
                {l.toDate > l.fromDate ? ` – ${formatDate(l.toDate)}` : ""} · {kind(l.kind)}
                {l.reviewNote && <span className="block text-xs text-ink-muted">{l.reviewNote}</span>}
              </span>
              <StatusPill status={l.status} />
            </div>
          ))
        )}
      </Card>
    </>
  );
}
