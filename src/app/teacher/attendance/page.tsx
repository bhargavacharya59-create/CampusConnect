import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatLong, istToday } from "@/lib/dates";
import { teacherToday } from "@/lib/pending";
import { Card, Empty, PageHeader } from "@/components/ui";
import { getMe } from "../data";
import { AttendanceSheet } from "./AttendanceSheet";

export const metadata: Metadata = { title: "Take attendance" };

const STATE = {
  TAKEN: { label: "Taken", cls: "pill-green" },
  MISSED: { label: "Not taken", cls: "pill-red" },
  NOW: { label: "In progress", cls: "pill-amber" },
  LATER: { label: "Later", cls: "pill-gray" },
} as const;

export default async function AttendancePage({ searchParams }: { searchParams: { assignment?: string; period?: string } }) {
  const { teacher } = await getMe();
  const today = await teacherToday(teacher.id);

  // Selected period: from the URL, else the first one that needs attendance now.
  const fromUrl = today.find((p) => String(p.assignmentId) === searchParams.assignment && String(p.period) === searchParams.period);
  const selected = fromUrl ?? today.find((p) => p.state === "NOW") ?? today.find((p) => p.state === "MISSED");

  let sheet: React.ReactNode = null;
  if (selected && selected.state !== "LATER") {
    const [students, session] = await Promise.all([
      prisma.student.findMany({ where: { classId: selected.classId }, orderBy: { rollNo: "asc" }, select: { id: true, rollNo: true, user: { select: { name: true } } } }),
      prisma.attendanceSession.findUnique({
        where: { assignmentId_date_period: { assignmentId: selected.assignmentId, date: istToday(), period: selected.period } },
        include: { records: { where: { status: "A" }, select: { studentId: true } } },
      }),
    ]);
    sheet = (
      <AttendanceSheet
        key={`${selected.assignmentId}-${selected.period}`}
        assignmentId={selected.assignmentId}
        period={selected.period}
        title={`${selected.subject} · ${selected.classId} · ${selected.start}–${selected.end}`}
        students={students.map((s) => ({ id: s.id, name: s.user.name, rollNo: s.rollNo }))}
        initialAbsent={session ? session.records.map((r) => r.studentId) : []}
        alreadyTaken={!!session}
      />
    );
  }

  return (
    <>
      <PageHeader title="Take attendance" subtitle={`${formatLong(istToday())} · attendance can be edited until midnight; every change is saved with your ID`} />

      <Card title="Today's periods">
        {today.length === 0 ? (
          <Empty>You have no classes today.</Empty>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {today.map((p) => {
              const active = selected && p.assignmentId === selected.assignmentId && p.period === selected.period;
              const content = (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <b>{p.start}</b>
                    <span className={`pill ${STATE[p.state].cls}`}>{STATE[p.state].label}</span>
                  </div>
                  <div className="mt-1 font-bold">{p.subject}</div>
                  <div className="text-xs text-ink-muted">
                    {p.classId} · {p.room}
                  </div>
                </>
              );
              return p.state === "LATER" ? (
                <div key={p.slotId} className="rounded-xl border border-line bg-ground p-3 opacity-70" aria-disabled>
                  {content}
                </div>
              ) : (
                <Link
                  key={p.slotId}
                  href={`/teacher/attendance?assignment=${p.assignmentId}&period=${p.period}`}
                  aria-current={active ? "true" : undefined}
                  className={`rounded-xl border p-3 hover:border-[color:var(--accent)] ${active ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]" : "border-line bg-white"}`}
                >
                  {content}
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      {sheet ?? (today.length > 0 && <Empty>Choose a period above. Periods that haven&apos;t started yet open when the class begins.</Empty>)}
    </>
  );
}
