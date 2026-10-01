import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { StaffShell } from "@/components/shell/StaffShell";
import { countByArea, themeFor } from "@/lib/pending";
import { getMe, getMyPending } from "./data";

export const metadata: Metadata = { title: "Director" };

export default async function DirectorLayout({ children }: { children: React.ReactNode }) {
  const { session, dept } = await getMe();
  const tasks = await getMyPending();
  const c = countByArea(tasks);
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } });

  if (!dept) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="card max-w-md text-center">
          <h1 className="text-xl font-extrabold">No department assigned</h1>
          <p className="mt-2 text-sm text-ink-muted">Your Director account isn&apos;t linked to a department yet. Please ask the Dean to assign you from Departments.</p>
        </div>
      </main>
    );
  }

  return (
    <StaffShell
      theme={themeFor(tasks)}
      subtitle={`Director · ${dept.id}`}
      userId={session.userId}
      userName={user?.name ?? session.name}
      home="/director"
      nav={[
        { href: "/director", label: "Overview" },
        { href: "/director/marks", label: "Marks approval", count: c.marks },
        { href: "/director/leave", label: "Leave requests", count: c.leave },
        { href: "/director/attendance", label: "Low attendance", count: c.attendance },
        { href: "/director/alerts", label: "At-risk alerts (AI)" },
        { href: "/director/students", label: "Find a student" },
        { href: "/director/teachers", label: "Teachers & workload" },
        { href: "/director/timetable", label: "Timetable" },
        { href: "/director/requests", label: "Requests to Dean" },
        { href: "/director/notices", label: "Notices & calendar" },
        { href: "/director/reports", label: "Reports" },
      ]}
    >
      {children}
    </StaffShell>
  );
}
