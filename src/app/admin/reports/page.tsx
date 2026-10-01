import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Reports" };

const REPORTS = [
  { kind: "attendance", title: "Attendance" },
  { kind: "low-attendance", title: "Low attendance" },
  { kind: "marks", title: "Published marks" },
  { kind: "fees", title: "Fees" },
  { kind: "staff", title: "Staff & workload" },
];

export default async function AdminReports() {
  await requireRole("ADMIN");
  const depts = await prisma.department.findMany({ orderBy: { id: "asc" }, select: { id: true } });
  return (
    <>
      <PageHeader title="Reports" subtitle="CSV downloads that open in Excel" />
      <div className="grid gap-4 md:grid-cols-2">
        {REPORTS.map((r) => (
          <Card key={r.kind} title={r.title}>
            <div className="flex flex-wrap gap-2">
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
