import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/ui";
import { getDept } from "../data";

export const metadata: Metadata = { title: "Reports" };

const REPORTS = [
  { kind: "attendance", title: "Attendance", text: "Every student with classes attended, held and percentage." },
  { kind: "low-attendance", title: "Low attendance", text: "Students below 75%, lowest first, with parent phone numbers." },
  { kind: "marks", title: "Published marks", text: "All published test marks per student and subject." },
  { kind: "fees", title: "Fees", text: "Every fee item with status and receipts." },
  { kind: "staff", title: "Staff & workload", text: "Teachers, proctor classes, subjects and periods per week." },
];

export default async function DirectorReports() {
  const { dept } = await getDept();
  return (
    <>
      <PageHeader title="Reports" subtitle={`${dept.name} · CSV files that open in Excel or Google Sheets`} />
      <div className="grid gap-4 md:grid-cols-2">
        {REPORTS.map((r) => (
          <Card key={r.kind} title={r.title}>
            <p className="text-sm text-ink-muted">{r.text}</p>
            <a href={`/api/reports/${r.kind}`} className="btn btn-sm mt-3">
              Download {dept.id} CSV
            </a>
          </Card>
        ))}
      </div>
    </>
  );
}
