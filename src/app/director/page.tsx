import Link from "next/link";
import { prisma } from "@/lib/db";
import { ATTENDANCE_THRESHOLD } from "@/lib/constants";
import { formatDay, greeting, istToday } from "@/lib/dates";
import { pct } from "@/lib/format";
import { percent } from "@/lib/attendance";
import { lowAttendanceInDepartment } from "@/lib/pending";
import { attendanceByClass, feeCollection, marksByClass, upcomingEvents } from "@/lib/queries/staff";
import { Bar, Card, Empty, Kpi, KpiGrid, PageHeader, PendingBanner, StatusPill } from "@/components/ui";
import { getDept, getMyPending } from "./data";

export default async function DirectorHome() {
  const { session, dept } = await getDept();
  const [tasks, classes, marks, fees, low, events, requests, teachers, students] = await Promise.all([
    getMyPending(),
    attendanceByClass(dept.id),
    marksByClass(dept.id),
    feeCollection(dept.id),
    lowAttendanceInDepartment(dept.id),
    upcomingEvents(dept.id, istToday(), 5),
    prisma.deanRequest.findMany({ where: { departmentId: dept.id }, orderBy: { createdAt: "desc" }, take: 4 }),
    prisma.teacher.count({ where: { departmentId: dept.id } }),
    prisma.student.count({ where: { class: { departmentId: dept.id } } }),
  ]);
  const totals = classes.reduce((a, c) => ({ p: a.p + c.present, t: a.t + c.total }), { p: 0, t: 0 });
  const deptPct = percent(totals.p, totals.t);

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${session.name}`}
        subtitle={`${dept.name} · ${classes.length} classes · ${students} students · ${teachers} teachers`}
        actions={
          <Link href="/director/requests" className="btn-outline">
            Raise request to Dean
          </Link>
        }
      />
      <PendingBanner tasks={tasks} doneText="No approvals, leave requests or parent alerts waiting." />
      <KpiGrid>
        <Kpi label="Department attendance" value={pct(deptPct)} danger={deptPct < ATTENDANCE_THRESHOLD} />
        <Kpi label="Students below 75%" value={low.low.length} danger={low.low.length > 0} />
        <Kpi label="Waiting for your approval" value={tasks.filter((t) => t.area === "marks" || t.area === "leave").length} />
        <Kpi label="Fees collected" value={pct(fees.pct)} />
      </KpiGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Class attendance">
          <div className="flex flex-col gap-3 py-1">
            {classes.map((c) => (
              <Bar key={c.id} label={`${c.id} · ${c.proctor.replace(/^Prof\.\s*/, "")}`} value={c.pct} width={190} />
            ))}
          </div>
        </Card>
        <Card title="Class results (approved & published tests)">
          <table className="table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Average</th>
                <th>Pass rate (≥40%)</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => {
                const m = marks.get(c.id);
                return (
                  <tr key={c.id}>
                    <td className="font-bold">{c.id}</td>
                    <td>{m ? pct(percent(m.got, m.max)) : "–"}</td>
                    <td>{m ? pct(percent(m.pass, m.n)) : "–"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
        <Card title="Upcoming">
          {events.length === 0 ? (
            <Empty>Nothing scheduled.</Empty>
          ) : (
            events.map((e) => (
              <div key={e.id} className="row">
                <span>{e.title}</span>
                <b className="text-[color:var(--accent)]">{formatDay(e.date)}</b>
              </div>
            ))
          )}
        </Card>
        <Card
          title="Your requests to the Dean"
          action={
            <Link href="/director/requests" className="link text-sm">
              All
            </Link>
          }
        >
          {requests.length === 0 ? (
            <Empty>No requests yet.</Empty>
          ) : (
            requests.map((r) => (
              <div key={r.id} className="row">
                <span className="min-w-0">
                  <span className="block font-semibold">{r.title}</span>
                  {r.reply && <span className="block truncate text-xs text-ink-muted">Dean: {r.reply}</span>}
                </span>
                <StatusPill status={r.status} />
              </div>
            ))
          )}
        </Card>
      </div>
    </>
  );
}
