import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { rupees } from "@/lib/format";
import { feeCollection } from "@/lib/queries/staff";
import { Card, Kpi, KpiGrid, PageHeader } from "@/components/ui";

export default async function AdminHome() {
  await requireRole("ADMIN");
  const [byRole, classes, fees, defaultPw] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.class.count(),
    feeCollection(),
    prisma.user.count({ where: { mustChangePassword: true } }),
  ]);
  const n = (r: string) => byRole.find((x) => x.role === r)?._count._all ?? 0;

  return (
    <>
      <PageHeader title="College Office" subtitle="Manage accounts, import real data, record fee payments" />
      <KpiGrid>
        <Kpi label="Students" value={n("STUDENT")} />
        <Kpi label="Parents" value={n("PARENT")} />
        <Kpi label="Teachers" value={n("TEACHER")} hint={`${n("DIRECTOR")} Directors · ${n("DEAN")} Dean`} />
        <Kpi label="Classes" value={classes} />
      </KpiGrid>
      <KpiGrid>
        <Kpi label="Fees collected" value={rupees(fees.paid)} hint={`of ${rupees(fees.total)}`} />
        <Kpi label="Fees outstanding" value={rupees(fees.total - fees.paid)} />
        <Kpi label="Accounts still on first password" value={defaultPw} />
        <Kpi label="Total logins" value={byRole.reduce((s, r) => s + r._count._all, 0)} />
      </KpiGrid>
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Moving to real data">
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            <li>Add staff accounts (Teachers, Directors, Dean).</li>
            <li>Set proctors and subject teachers in Classes &amp; teachers.</li>
            <li>Import students from Excel (saved as CSV). Parent logins are created automatically.</li>
            <li>Share IDs and first-time passwords privately.</li>
          </ol>
        </Card>
        <Card title="Quick actions">
          <div className="flex flex-col gap-2">
            <Link href="/admin/users" className="btn-outline">
              Reset a password
            </Link>
            <Link href="/admin/fees" className="btn-outline">
              Record a fee payment
            </Link>
            <Link href="/admin/students" className="btn-outline">
              Add a student
            </Link>
          </div>
        </Card>
        <Card title="Help">
          <p className="text-sm text-ink-muted">Every new account must change its first-time password after signing in. Parents sign in with the student ID plus “P”.</p>
        </Card>
      </div>
    </>
  );
}
