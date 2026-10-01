import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDay, formatLong, greeting, istToday } from "@/lib/dates";
import { pct } from "@/lib/format";
import { teacherToday } from "@/lib/pending";
import { classAttendance, upcomingEvents } from "@/lib/queries/staff";
import { Bar, Card, Empty, Kpi, KpiGrid, PageHeader, PendingBanner } from "@/components/ui";
import { getMe, getMyPending } from "./data";

const STATE = {
  TAKEN: { label: "Taken", cls: "pill-green" },
  MISSED: { label: "Not taken", cls: "pill-red" },
  NOW: { label: "In progress", cls: "pill-amber" },
  LATER: { label: "Later", cls: "pill-gray" },
} as const;

export default async function TeacherHome() {
  const { teacher } = await getMe();
  const [tasks, today, events, toReview] = await Promise.all([
    getMyPending(),
    teacherToday(teacher.id),
    upcomingEvents(teacher.departmentId, istToday(), 4),
    prisma.submission.count({ where: { status: { in: ["SUBMITTED", "AI_CHECKED", "AI_FAILED"] }, coursework: { assignment: { teacherId: teacher.id } } } }),
  ]);
  const proctor = teacher.proctorOf ? await classAttendance(teacher.proctorOf.id) : null;
  const missed = today.filter((p) => p.state === "MISSED").length;

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${teacher.user.name}`}
        subtitle={`${formatLong(istToday())}${teacher.proctorOf ? ` · Proctor of ${teacher.proctorOf.name}` : ""}`}
        actions={
          <Link href="/teacher/attendance" className="btn">
            Take attendance
          </Link>
        }
      />
      <PendingBanner tasks={tasks} doneText="Attendance is taken, submissions are reviewed and messages are answered." />

      <KpiGrid>
        <Kpi label="Classes today" value={today.length} />
        <Kpi label="Attendance not taken" value={missed} danger={missed > 0} />
        <Kpi label="Submissions to review" value={toReview} danger={toReview > 0} />
        <Kpi label="Proctor class attendance" value={proctor ? pct(proctor.overall) : "–"} />
      </KpiGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Today's classes">
          {today.length === 0 ? (
            <Empty>No classes today.</Empty>
          ) : (
            today.map((p) => (
              <div key={p.slotId} className="row">
                <div className="flex min-w-0 items-center gap-3">
                  <b className="w-12 shrink-0">{p.start}</b>
                  <div className="min-w-0">
                    <div className="truncate font-bold">{p.subject}</div>
                    <div className="text-xs text-ink-muted">
                      {p.classId} · {p.room}
                      {p.taken ? ` · ${p.total - p.absent}/${p.total} present` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`pill ${STATE[p.state].cls}`}>{STATE[p.state].label}</span>
                  {p.state !== "LATER" && (
                    <Link href={`/teacher/attendance?assignment=${p.assignmentId}&period=${p.period}`} className={p.taken ? "btn-outline btn-sm" : "btn btn-sm"}>
                      {p.taken ? "Edit" : "Take"}
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </Card>

        {proctor && teacher.proctorOf ? (
          <Card
            title={`My proctor class · ${teacher.proctorOf.name}`}
            action={
              <Link href="/teacher/proctor" className="link text-sm">
                Open class
              </Link>
            }
          >
            <div className="flex flex-col gap-3 py-1">
              {proctor.subjects.map((s) => (
                <Bar key={s.subjectId} label={s.name} value={s.pct} width={150} />
              ))}
            </div>
            <p className="mt-3 text-sm text-ink-muted">
              {proctor.low.length} of {proctor.rows.length} students are below 75% overall or in at least one subject.
            </p>
          </Card>
        ) : (
          <Card title="Upcoming">
            <Events events={events} />
          </Card>
        )}
      </div>

      {proctor && (
        <Card title="Upcoming">
          <Events events={events} />
        </Card>
      )}
    </>
  );
}

function Events({ events }: { events: { id: string; title: string; date: Date }[] }) {
  if (!events.length) return <Empty>Nothing scheduled.</Empty>;
  return (
    <>
      {events.map((e) => (
        <div key={e.id} className="row">
          <span>{e.title}</span>
          <b className="shrink-0 text-[color:var(--accent)]">{formatDay(e.date)}</b>
        </div>
      ))}
    </>
  );
}
