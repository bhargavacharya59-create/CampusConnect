import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { deanCounts } from "@/lib/pending";
import { StaffShell } from "@/components/shell/StaffShell";

export const metadata: Metadata = { title: "Dean" };

export default async function DeanLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("DEAN");
  const c = await deanCounts();
  return (
    <StaffShell
      theme="brand"
      subtitle="Dean"
      userId={session.userId}
      userName={session.name}
      home="/dean"
      nav={[
        { href: "/dean", label: "Overview" },
        { href: "/dean/results", label: "Publish results", count: c.results },
        { href: "/dean/requests", label: "Approvals", count: c.requests },
        { href: "/dean/departments", label: "Departments" },
        { href: "/dean/students", label: "Find a student" },
        { href: "/dean/notices", label: "Notices & calendar" },
        { href: "/dean/reports", label: "Reports" },
      ]}
    >
      {children}
    </StaffShell>
  );
}
