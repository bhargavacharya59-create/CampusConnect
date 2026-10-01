import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { LEAVE_KINDS } from "@/lib/constants";
import { formatDate, isoDate, istToday } from "@/lib/dates";
import { Card, Empty, PageHeader, StatusPill } from "@/components/ui";
import { ActionForm, InlineAction, SubmitButton } from "@/components/forms";
import { getMe } from "../data";
import { applyLeave, cancelLeave } from "../actions";

export const metadata: Metadata = { title: "Apply leave" };

export default async function LeavePage() {
  const { teacher } = await getMe();
  const leaves = await prisma.leaveRequest.findMany({ where: { teacherId: teacher.id }, orderBy: { createdAt: "desc" } });
  const today = isoDate(istToday());

  return (
    <>
      <PageHeader title="Apply leave" subtitle={`Requests go to the Director of ${teacher.department.name}`} />
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <Card title="New request">
          <ActionForm action={applyLeave}>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fromDate" className="label">
                  From
                </label>
                <input id="fromDate" name="fromDate" type="date" min={today} required className="field" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="toDate" className="label">
                  To
                </label>
                <input id="toDate" name="toDate" type="date" min={today} className="field" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="kind" className="label">
                Type
              </label>
              <select id="kind" name="kind" className="field">
                {Object.entries(LEAVE_KINDS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reason" className="label">
                Reason
              </label>
              <textarea id="reason" name="reason" rows={3} required maxLength={500} className="field h-auto py-2.5" />
            </div>
            <SubmitButton busy="Sending…">Send request</SubmitButton>
          </ActionForm>
        </Card>
        <Card title="My requests">
          {leaves.length === 0 ? (
            <Empty>No leave requests yet.</Empty>
          ) : (
            leaves.map((l) => (
              <div key={l.id} className="flex flex-wrap items-start justify-between gap-3 border-b border-line-soft py-3 last:border-b-0">
                <div>
                  <div className="font-bold">
                    {formatDate(l.fromDate)}
                    {l.toDate > l.fromDate ? ` – ${formatDate(l.toDate)}` : ""} · {LEAVE_KINDS[l.kind as keyof typeof LEAVE_KINDS] ?? l.kind}
                  </div>
                  <div className="text-sm text-ink-muted">{l.reason}</div>
                  {l.reviewNote && <div className="mt-1 text-sm">Director: {l.reviewNote}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={l.status} />
                  {l.status === "PENDING" && <InlineAction action={cancelLeave} fields={{ leaveId: l.id }} label="Cancel" className="btn-outline btn-sm" confirm="Cancel this leave request?" />}
                </div>
              </div>
            ))
          )}
        </Card>
      </div>
    </>
  );
}
