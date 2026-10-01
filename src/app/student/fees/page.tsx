import type { Metadata } from "next";
import { formatDate } from "@/lib/dates";
import { rupees } from "@/lib/format";
import { getFees } from "@/lib/queries/student";
import { Card, Kpi, KpiGrid, PageHeader } from "@/components/ui";
import { getMe } from "../data";

export const metadata: Metadata = { title: "Fees" };

const MODE: Record<string, string> = { UPI: "UPI", BANK: "Bank transfer", CARD: "Card", CASH: "Cash" };

export default async function StudentFees() {
  const { me } = await getMe();
  const fees = await getFees(me.id);
  return (
    <>
      <PageHeader title="Fees" subtitle="Pay at the accounts office (Mon–Fri, 10 am–4 pm) or by bank transfer quoting your student ID" />
      <KpiGrid>
        <Kpi label="To pay" value={rupees(fees.dueTotal)} danger={fees.rows.some((r) => r.state === "OVERDUE")} />
        <Kpi label="Paid this semester" value={rupees(fees.paidTotal)} />
        <Kpi label="Next due" value={fees.nextDue ? formatDate(fees.nextDue.dueDate) : "–"} />
        <Kpi label="Fee items" value={fees.rows.length} />
      </KpiGrid>
      <Card title="Fee details">
        <div className="-mx-4 overflow-x-auto">
          <table className="table min-w-[640px]">
            <thead>
              <tr>
                <th>Fee</th>
                <th>Due</th>
                <th className="text-right">Amount</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {fees.rows.map((f) => (
                <tr key={f.id}>
                  <td className="font-semibold">{f.title}</td>
                  <td>{formatDate(f.dueDate)}</td>
                  <td className="text-right font-bold">{rupees(f.amount)}</td>
                  <td>
                    <span className={`pill ${f.state === "PAID" ? "pill-green" : f.state === "OVERDUE" ? "pill-red" : "pill-amber"}`}>{f.state === "PAID" ? "Paid" : f.state === "OVERDUE" ? "Overdue" : "Due"}</span>
                  </td>
                  <td className="text-sm">
                    {f.paidAt ? (
                      <>
                        <span className="font-mono">{f.receiptNo}</span>
                        <span className="block text-xs text-ink-muted">
                          {formatDate(f.paidAt)} · {MODE[f.mode ?? ""] ?? f.mode}
                        </span>
                      </>
                    ) : (
                      "–"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
