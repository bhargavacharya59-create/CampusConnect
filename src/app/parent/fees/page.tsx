import type { Metadata } from "next";
import { formatDate } from "@/lib/dates";
import { rupees } from "@/lib/format";
import { getFees } from "@/lib/queries/student";
import { getParentAndChild } from "../data";
import { SectionTitle } from "../ui";

export const metadata: Metadata = { title: "Fees" };

const MODE: Record<string, string> = { UPI: "UPI", BANK: "Bank transfer", CARD: "Card", CASH: "Cash" };

export default async function FeesPage() {
  const { child } = await getParentAndChild();
  if (!child) return null;
  const fees = await getFees(child.id);

  return (
    <>
      <section className="card grid grid-cols-2 shadow-[0_10px_24px_rgba(11,61,58,0.10)]">
        <h1 className="sr-only">Fees</h1>
        <div>
          <div className="text-xs font-semibold text-ink-muted">To pay</div>
          <div className={`text-2xl font-extrabold ${fees.dueTotal ? "text-warn-800" : "text-ok-700"}`}>{rupees(fees.dueTotal)}</div>
        </div>
        <div className="border-l border-line-soft pl-4">
          <div className="text-xs font-semibold text-ink-muted">Paid this semester</div>
          <div className="text-2xl font-extrabold">{rupees(fees.paidTotal)}</div>
        </div>
      </section>

      <section className="card">
        <SectionTitle>Fee details</SectionTitle>
        {fees.rows.map((f) => (
          <div key={f.id} className="border-b border-line-soft py-3 last:border-b-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-bold">{f.title}</div>
                <div className="text-xs text-ink-muted">Due {formatDate(f.dueDate)}</div>
              </div>
              <div className="text-right">
                <div className="font-extrabold">{rupees(f.amount)}</div>
                {f.state === "PAID" && <span className="pill pill-green">Paid</span>}
                {f.state === "DUE" && <span className="pill pill-amber">Due</span>}
                {f.state === "OVERDUE" && <span className="pill pill-red">Overdue</span>}
              </div>
            </div>
            {f.state === "PAID" && f.paidAt && (
              <div className="mt-1.5 rounded-lg bg-ground px-2.5 py-1.5 text-xs text-ink-soft">
                Paid {formatDate(f.paidAt)}
                {f.mode ? ` · ${MODE[f.mode] ?? f.mode}` : ""}
                {f.receiptNo ? (
                  <>
                    {" "}
                    · Receipt <span className="font-mono">{f.receiptNo}</span>
                  </>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="card text-sm text-ink-soft">
        <SectionTitle>How to pay</SectionTitle>
        <p>
          Pay at the college accounts office (Monday to Friday, 10 am to 4 pm) or by bank transfer. Quote the student ID{" "}
          <span className="font-mono font-semibold">{child.id}</span>. Payments show here once the office records them.
        </p>
      </section>
    </>
  );
}
