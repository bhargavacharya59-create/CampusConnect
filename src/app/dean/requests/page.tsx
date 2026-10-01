import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { REQUEST_KINDS } from "@/lib/constants";
import { formatDateTime } from "@/lib/dates";
import { rupees } from "@/lib/format";
import { Card, Empty, PageHeader, StatusPill } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { decideRequest } from "../actions";

export const metadata: Metadata = { title: "Approvals" };

export default async function DeanRequests() {
  await requireRole("DEAN");
  const all = await prisma.deanRequest.findMany({ orderBy: { createdAt: "desc" }, take: 80, include: { department: true, createdBy: { select: { name: true } } } });
  const pending = all.filter((r) => r.status === "PENDING");
  const done = all.filter((r) => r.status !== "PENDING");
  const kind = (k: string) => REQUEST_KINDS[k as keyof typeof REQUEST_KINDS] ?? k;

  return (
    <>
      <PageHeader title="Approvals" subtitle="Events, budgets and new courses requested by Directors" />
      <Card title={`Waiting (${pending.length})`}>
        {pending.length === 0 ? (
          <Empty>No requests waiting.</Empty>
        ) : (
          pending.map((r) => (
            <div key={r.id} className="border-b border-line-soft py-4 last:border-b-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-extrabold">{r.title}</div>
                  <div className="text-sm text-ink-muted">
                    {kind(r.kind)} · {r.department.name} · {r.createdBy.name} · {formatDateTime(r.createdAt)}
                    {r.amount != null && (
                      <>
                        {" "}
                        · <b className="text-ink">{rupees(r.amount)}</b>
                      </>
                    )}
                  </div>
                  <p className="mt-1 text-sm">{r.details}</p>
                </div>
                <StatusPill status={r.status} />
              </div>
              <ActionForm action={decideRequest} className="mt-3 flex flex-wrap items-end gap-2">
                <input type="hidden" name="requestId" value={r.id} />
                <div className="flex min-w-[240px] flex-1 flex-col gap-1">
                  <label htmlFor={`r-${r.id}`} className="text-xs font-bold">
                    Reply to the Director
                  </label>
                  <input id={`r-${r.id}`} name="reply" className="field field-sm" />
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
      <Card title="Decided">
        {done.length === 0 ? (
          <Empty>Nothing decided yet.</Empty>
        ) : (
          done.map((r) => (
            <div key={r.id} className="row">
              <span className="min-w-0">
                <b>{r.title}</b> · {r.department.id}
                {r.reply && <span className="block truncate text-xs text-ink-muted">{r.reply}</span>}
              </span>
              <StatusPill status={r.status} />
            </div>
          ))
        )}
      </Card>
    </>
  );
}
