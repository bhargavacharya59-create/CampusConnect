import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { addDays, formatDate, isoDate, istToday } from "@/lib/dates";
import { normalizeId } from "@/lib/ids";
import { rupees } from "@/lib/format";
import { Card, Empty, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { addFeeForClass, recordPayment } from "../actions";

export const metadata: Metadata = { title: "Fees" };

export default async function AdminFees({ searchParams }: { searchParams: { student?: string } }) {
  await requireRole("ADMIN");
  const sid = searchParams.student ? normalizeId(searchParams.student).replace(/P$/, "") : "";
  const today = istToday();
  const [student, classes, depts] = await Promise.all([
    sid ? prisma.student.findUnique({ where: { id: sid }, include: { user: { select: { name: true } }, invoices: { orderBy: { dueDate: "asc" } } } }) : null,
    prisma.class.findMany({ orderBy: { id: "asc" }, select: { id: true } }),
    prisma.department.findMany({ orderBy: { id: "asc" }, select: { id: true } }),
  ]);

  return (
    <>
      <PageHeader title="Fees" subtitle="Record payments made at the office and add new fee items" />
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-4">
          <Card title="Record a payment">
            <form action="/admin/fees" className="flex flex-wrap gap-2">
              <label htmlFor="student" className="sr-only">
                Student or parent ID
              </label>
              <input id="student" name="student" defaultValue={searchParams.student} placeholder="Student ID, e.g. 24SUUBECS0045" className="field max-w-sm font-mono" />
              <button type="submit" className="btn">
                Find
              </button>
            </form>
            {sid && !student && <Empty>No student with ID {sid}.</Empty>}
            {student && (
              <div className="mt-3">
                <div className="mb-1 font-extrabold">
                  {student.user.name} · <span className="font-mono">{student.id}</span> · {student.classId}
                </div>
                {student.invoices.map((f) => (
                  <div key={f.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft py-3 last:border-b-0">
                    <div>
                      <div className="font-semibold">{f.title}</div>
                      <div className="text-xs text-ink-muted">
                        {rupees(f.amount)} · due {formatDate(f.dueDate)}
                        {f.paidAt ? ` · paid ${formatDate(f.paidAt)} · ${f.receiptNo}` : ""}
                      </div>
                    </div>
                    {f.paidAt ? (
                      <span className="pill pill-green">Paid</span>
                    ) : (
                      <ActionForm action={recordPayment} className="flex items-center gap-2" resetOnSuccess={false}>
                        <input type="hidden" name="invoiceId" value={f.id} />
                        <label htmlFor={`mode-${f.id}`} className="sr-only">
                          Mode
                        </label>
                        <select id={`mode-${f.id}`} name="mode" className="field field-sm w-32">
                          <option value="CASH">Cash</option>
                          <option value="UPI">UPI</option>
                          <option value="CARD">Card</option>
                          <option value="BANK">Bank transfer</option>
                        </select>
                        <SubmitButton className="btn btn-sm h-10" busy="…">
                          Mark paid
                        </SubmitButton>
                        {f.dueDate < today && <span className="pill pill-red">Overdue</span>}
                      </ActionForm>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
        <Card title="Add a fee item">
          <ActionForm action={addFeeForClass}>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="scope" className="label">
                For
              </label>
              <select id="scope" name="scope" className="field">
                <option value="ALL">All students</option>
                {depts.map((d) => (
                  <option key={d.id} value={d.id}>
                    Department {d.id}
                  </option>
                ))}
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Class {c.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="title" className="label">
                Fee name
              </label>
              <input id="title" name="title" required placeholder="Semester 6 tuition · Instalment 1" className="field" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="amount" className="label">
                  Amount (₹)
                </label>
                <input id="amount" name="amount" type="number" min={1} required className="field" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="dueDate" className="label">
                  Due date
                </label>
                <input id="dueDate" name="dueDate" type="date" defaultValue={isoDate(addDays(today, 30))} required className="field" />
              </div>
            </div>
            <SubmitButton busy="Adding…">Add fee</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
