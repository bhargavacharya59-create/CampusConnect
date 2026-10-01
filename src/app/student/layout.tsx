import type { Metadata } from "next";
import { StaffShell } from "@/components/shell/StaffShell";
import { countByArea, themeFor } from "@/lib/pending";
import { getMe, getMyPending } from "./data";

export const metadata: Metadata = { title: "Student" };

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const { me } = await getMe();
  const tasks = await getMyPending();
  const c = countByArea(tasks);
  return (
    <StaffShell
      theme={themeFor(tasks)}
      subtitle={`Student · ${me.class.name}`}
      userId={me.id}
      userName={me.user.name}
      home="/student"
      nav={[
        { href: "/student", label: "Home" },
        { href: "/student/assignments", label: "Assignments", count: c.assignments },
        { href: "/student/attendance", label: "Attendance", count: c.attendance },
        { href: "/student/timetable", label: "Timetable" },
        { href: "/student/marks", label: "Marks" },
        { href: "/student/fees", label: "Fees", count: c.fees },
        { href: "/student/notices", label: "Notices & calendar" },
      ]}
    >
      {children}
    </StaffShell>
  );
}
