"use client";

import { useI18n } from "@/lib/i18n/context";

const MODE: Record<string, string> = { UPI: "UPI", BANK: "Bank transfer", CARD: "Card", CASH: "Cash" };

interface FeesData {
  dueTotal: string;
  dueTotalNum: number;
  paidTotal: string;
  childId: string;
  rows: {
    id: string;
    title: string;
    dueDate: string;
    amount: string;
    state: string;
    paidAt: string | null;
    mode: string | null;
    receiptNo: string | null;
  }[];
}

export function FeesContent(props: FeesData) {
  const { t } = useI18n();
  const { dueTotal, dueTotalNum, paidTotal, childId, rows } = props;

  return (
    <>
      <section className="card grid grid-cols-2 shadow-[0_10px_24px_rgba(11,61,58,0.10)]">
        <h1 className="sr-only">{t("fees")}</h1>
        <div>
          <div className="text-xs font-semibold text-ink-muted">{t("toPay")}</div>
          <div className={`text-2xl font-extrabold ${dueTotalNum ? "text-warn-800" : "text-ok-700"}`}>{dueTotal}</div>
        </div>
        <div className="border-l border-line-soft pl-4">
          <div className="text-xs font-semibold text-ink-muted">{t("paidThisSemester")}</div>
          <div className="text-2xl font-extrabold">{paidTotal}</div>
        </div>
      </section>

      <section className="card">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-extrabold">{t("feeDetails")}</h2>
        </div>
        {rows.map((f) => (
          <div key={f.id} className="border-b border-line-soft py-3 last:border-b-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-bold">{f.title}</div>
                <div className="text-xs text-ink-muted">{t("due")} {f.dueDate}</div>
              </div>
              <div className="text-right">
                <div className="font-extrabold">{f.amount}</div>
                {f.state === "PAID" && <span className="pill pill-green">{t("paid")}</span>}
                {f.state === "DUE" && <span className="pill pill-amber">{t("due")}</span>}
                {f.state === "OVERDUE" && <span className="pill pill-red">{t("overdue")}</span>}
              </div>
            </div>
            {f.state === "PAID" && f.paidAt && (
              <div className="mt-1.5 rounded-lg bg-ground px-2.5 py-1.5 text-xs text-ink-soft">
                {t("paidOn", { date: f.paidAt })}
                {f.mode ? ` · ${MODE[f.mode] ?? f.mode}` : ""}
                {f.receiptNo ? (
                  <>
                    {" "}
                    · {t("receipt")} <span className="font-mono">{f.receiptNo}</span>
                  </>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="card text-sm text-ink-soft">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-extrabold">{t("howToPay")}</h2>
        </div>
        <p>{t("howToPayDesc", { id: childId })}</p>
      </section>
    </>
  );
}
