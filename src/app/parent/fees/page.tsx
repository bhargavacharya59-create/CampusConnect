import type { Metadata } from "next";
import { formatDate } from "@/lib/dates";
import { rupees } from "@/lib/format";
import { getFees } from "@/lib/queries/student";
import { getParentAndChild } from "../data";
import { FeesContent } from "./FeesContent";

export const metadata: Metadata = { title: "Fees" };

export default async function FeesPage() {
  const { child } = await getParentAndChild();
  if (!child) return null;
  const fees = await getFees(child.id);

  return (
    <FeesContent
      dueTotal={rupees(fees.dueTotal)}
      dueTotalNum={fees.dueTotal}
      paidTotal={rupees(fees.paidTotal)}
      childId={child.id}
      rows={fees.rows.map((f) => ({
        id: f.id,
        title: f.title,
        dueDate: formatDate(f.dueDate),
        amount: rupees(f.amount),
        state: f.state,
        paidAt: f.paidAt ? formatDate(f.paidAt) : null,
        mode: f.mode,
        receiptNo: f.receiptNo,
      }))}
    />
  );
}
