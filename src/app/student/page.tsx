import Link from "next/link";
import { prisma } from "@/lib/db";
import { ATTENDANCE_THRESHOLD } from "@/lib/constants";
import { addDays, formatDay, formatDateTime, greeting, istToday } from "@/lib/dates";
import { pct, rupees } from "@/lib/format";
import { getAttendance, getFees, getNoticesFor, getToday } from "@/lib/queries/student";
import { Card, Empty, Kpi, KpiGrid, PageHeader, PendingBanner } from "@/components/ui";
import { getMe, getMyPending } from "./data";

const PERIOD = {
  PRESENT: { label: "Present", cls: "pill-green" },
  ABSENT: { label: "Absent", cls: "pill-red" },
  NOT_MARKED: { label: "Not marked", cls: "pill-amber" },
  UPCOMING: { label: "Later", cls: "pill-gray" },
} as const;

export default async function StudentHome() {
  const { me } = await getMe();
  const today = istToday();
  const [tasks, att, day, fees, notices, due] = await Promise.all([
    getMyPending(),
    getAttendance(me.id),
    getToday(me.classId, me.id),
    getFees(me.id),
    getNoticesFor("STUDENTS", me.class.departmentId, 4),
    prisma.coursework.findMany({
      where: { assignment: { classId: me.classId }, dueDate: { gte: today, lte: addDays(today, 14) } },
      orderBy: { dueDate: "asc" },
      include: { assignment: { include: { subject: true } }, submissions: { where: { studentId: me.id }, select: { status: true } } },
    }),
  ]);
  const lowSubjects = att.subjects.filter((s) => s.pct < ATTENDANCE_THRESHOLD).length;

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${me.user.name.split(" ")[0]}`}
        subtitle={
          <>
            <span className="font-mono">{me.id}</span> · {me.class.name} · Semester {me.class.semester} · Proctor: {me.class.proctor?.user.name ?? "–"}
          </>
        }
      />
      <PendingBanner tasks={tasks} doneText="No assignments due, fees are paid and attendance is above 75% in every subject." />

      <KpiGrid>
        <Kpi label="Overall attendance" value={pct(att.pct)} danger={att.pct < ATTENDANCE_THRESHOLD} hint={att.needed ? `attend the next ${att.needed} classes` : `you can miss ${att.canMiss} more`} />
        <Kpi label="Subjects below 75%" value={lowSubjects} danger={lowSubjects > 0} />
        <Kpi label="Assignments due (2 weeks)" value={due.filter((c) => !c.submissions.some((s) => s.status !== "RETURNED")).length} />
        <Kpi label="Fee due" value={rupees(fees.dueTotal)} danger={fees.rows.some((r) => r.state === "OVERDUE")} />
      </KpiGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title={`Today · ${formatDay(day.date)}`}>
          {day.holiday ? (
            <Empty>No classes today.</Empty>
          ) : (
            day.periods.map((p) => (
              <div key={p.period} className="row">
                <div className="min-w-0">
                  <div className="font-semibold">
                    <span className="mr-1.5 font-extrabold text-[color:var(--accent)]">{p.start}</span>
                    {p.subject}
                  </div>
                  <div className="truncate text-xs text-ink-muted">
                    {p.teacher} · {p.room}
                  </div>
                </div>
                <span className={`pill ${PERIOD[p.status].cls}`}>{PERIOD[p.status].label}</span>
              </div>
            ))
          )}
        </Card>

        <Card
          title="Assignments"
          action={
            <Link href="/student/assignments" className="link text-sm">
              All
            </Link>
          }
        >
          {due.length === 0 ? (
            <Empty>Nothing due in the next two weeks.</Empty>
          ) : (
            due.map((c) => {
              const done = c.submissions.some((s) => s.status !== "RETURNED");
              return (
                <Link key={c.id} href={`/student/assignments/${c.id}`} className="row hover:bg-ground">
                  <span className="min-w-0">
                    <span className="block font-semibold">{c.title}</span>
                    <span className="block text-xs text-ink-muted">
                      {c.assignment.subject.name} · due {formatDay(c.dueDate)}
                    </span>
                  </span>
                  <span className={`pill ${done ? "pill-green" : "pill-amber"}`}>{done ? "Submitted" : "To do"}</span>
                </Link>
              );
            })
          )}
        </Card>

        <Card
          title="Notices"
          action={
            <Link href="/student/notices" className="link text-sm">
              All
            </Link>
          }
        >
          {notices.length === 0 ? (
            <Empty>No notices.</Empty>
          ) : (
            notices.map((n) => (
              <div key={n.id} className="border-b border-line-soft py-2.5 last:border-b-0">
                <div className="text-sm font-bold">{n.title}</div>
                <div className="text-xs text-ink-muted">
                  {n.author.name} · {formatDateTime(n.createdAt)}
                </div>
              </div>
            ))
          )}
        </Card>
      </div>
    </>
  );
}
