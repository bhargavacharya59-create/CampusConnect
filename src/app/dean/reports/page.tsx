import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Reports" };

const REPORTS = [
  { kind: "attendance", title: "Attendance", text: "Every student with classes attended, held and percentage." },
  { kind: "low-attendance", title: "Low attendance", text: "Students below 75%, lowest first, with parent phone numbers." },
  { kind: "marks", title: "Published marks", text: "All published test marks per student and subject." },
  { kind: "fees", title: "Fees", text: "Every fee item with paid, due and overdue status and receipts." },
  { kind: "staff", title: "Staff & workload", text: "Teachers, proctor classes, subjects and periods per week." },
];

export default async function DeanReports() {
  await requireRole("DEAN");
  const depts = await prisma.department.findMany({ orderBy: { id: "asc" }, select: { id: true } });
  return (
    <>
      <PageHeader title="Reports" subtitle="Download as CSV. Opens in Excel or Google Sheets." />
      <div className="grid gap-4 md:grid-cols-2">
        {REPORTS.map((r) => (
          <Card key={r.kind} title={r.title}>
            <p className="text-sm text-ink-muted">{r.text}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={`/api/reports/${r.kind}`} className="btn btn-sm">
                Whole college
              </a>
              {depts.map((d) => (
                <a key={d.id} href={`/api/reports/${r.kind}?dept=${d.id}`} className="btn-outline btn-sm">
                  {d.id}
                </a>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
