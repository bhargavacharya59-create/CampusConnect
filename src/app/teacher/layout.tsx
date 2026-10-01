import type { Metadata } from "next";
import { StaffShell } from "@/components/shell/StaffShell";
import { countByArea, themeFor } from "@/lib/pending";
import { getMe, getMyPending } from "./data";

export const metadata: Metadata = { title: "Teacher" };

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { teacher } = await getMe();
  const tasks = await getMyPending();
  const c = countByArea(tasks);

  return (
    <StaffShell
      theme={themeFor(tasks)}
      subtitle={`Teacher · ${teacher.id}`}
      userId={teacher.id}
      userName={teacher.user.name}
      home="/teacher"
      nav={[
        { href: "/teacher", label: "Today" },
        { href: "/teacher/attendance", label: "Take attendance", count: c.attendance },
        ...(teacher.proctorOf ? [{ href: "/teacher/proctor", label: "My proctor class" }] : []),
        { href: "/teacher/marks", label: "Marks entry", count: c.marks },
        { href: "/teacher/assignments", label: "Assignments", count: c.assignments },
        { href: "/teacher/messages", label: "Messages", count: c.messages },
        { href: "/teacher/timetable", label: "Timetable" },
        { href: "/teacher/leave", label: "Apply leave" },
        { href: "/teacher/ai", label: "AI helper" },
      ]}
    >
      {children}
    </StaffShell>
  );
}
