import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { REQUEST_KINDS } from "@/lib/constants";
import { formatDateTime } from "@/lib/dates";
import { rupees } from "@/lib/format";
import { Card, Empty, PageHeader, StatusPill } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { getDept } from "../data";
import { createDeanRequest } from "../actions";

export const metadata: Metadata = { title: "Requests to Dean" };

export default async function DirectorRequests() {
  const { dept } = await getDept();
  const requests = await prisma.deanRequest.findMany({ where: { departmentId: dept.id }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHeader title="Requests to the Dean" subtitle="Events, budgets, new courses and anything that needs the Dean's approval" />
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <Card title="New request">
          <ActionForm action={createDeanRequest}>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="kind" className="label">
                Type
              </label>
              <select id="kind" name="kind" className="field">
                {Object.entries(REQUEST_KINDS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="title" className="label">
                Title
              </label>
              <input id="title" name="title" required maxLength={120} className="field" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="details" className="label">
                Details
              </label>
              <textarea id="details" name="details" rows={4} required maxLength={2000} className="field h-auto py-2.5" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="amount" className="label">
                Amount in ₹ (if any)
              </label>
              <input id="amount" name="amount" type="number" min={0} className="field" />
            </div>
            <SubmitButton busy="Sending…">Send to Dean</SubmitButton>
          </ActionForm>
        </Card>
        <Card title="Your requests">
          {requests.length === 0 ? (
            <Empty>No requests yet.</Empty>
          ) : (
            requests.map((r) => (
              <div key={r.id} className="border-b border-line-soft py-3 last:border-b-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-extrabold">{r.title}</div>
                    <div className="text-xs text-ink-muted">
                      {REQUEST_KINDS[r.kind as keyof typeof REQUEST_KINDS] ?? r.kind} · {formatDateTime(r.createdAt)}
                      {r.amount != null ? ` · ${rupees(r.amount)}` : ""}
                    </div>
                  </div>
                  <StatusPill status={r.status} />
                </div>
                <p className="mt-1 text-sm text-ink-soft">{r.details}</p>
                {r.reply && <p className="mt-1 rounded-lg bg-ground px-3 py-1.5 text-sm">Dean: {r.reply}</p>}
              </div>
            ))
          )}
        </Card>
      </div>
    </>
  );
}
