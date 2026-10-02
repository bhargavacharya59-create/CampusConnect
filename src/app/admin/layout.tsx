import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { StaffShell } from "@/components/shell/StaffShell";

export const metadata: Metadata = { title: "College Office" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("ADMIN");
  return (
    <StaffShell
      theme="brand"
      subtitle="College Office"
      userId={session.userId}
      userName={session.name}
      home="/admin"
      nav={[
        { href: "/admin", label: "Overview" },
        { href: "/admin/users", label: "Users & passwords" },
        { href: "/admin/students", label: "Add student" },
        { href: "/admin/import", label: "Import from Excel" },
        { href: "/admin/staff", label: "Add staff" },
        { href: "/admin/classes", label: "Classes & teachers" },
        { href: "/admin/timetable", label: "Timetable" },
        { href: "/admin/fees", label: "Fees" },
        { href: "/admin/reports", label: "Reports" },
        { href: "/admin/ai", label: "AI status" },
      ]}
    >
      {children}
    </StaffShell>
  );
}
