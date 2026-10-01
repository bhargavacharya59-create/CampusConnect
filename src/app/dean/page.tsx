import Link from "next/link";
import { prisma } from "@/lib/db";
import { percent } from "@/lib/attendance";
import { ATTENDANCE_THRESHOLD, COLLEGE_NAME } from "@/lib/constants";
import { formatDay, formatLong, greeting, istToday } from "@/lib/dates";
import { pct, rupees } from "@/lib/format";
import { directorPending, lowAttendanceInDepartment } from "@/lib/pending";
import { attendanceByClass, feeCollection, marksByClass, upcomingEvents } from "@/lib/queries/staff";
import { Bar, Card, Empty, Kpi, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";

export default async function DeanHome() {
  const session = await requireRole("DEAN");
  const [depts, classes, marks, fees, students, teachers, results, requests, events] = await Promise.all([
    prisma.department.findMany({ orderBy: { id: "asc" }, include: { director: { select: { name: true } } } }),
    attendanceByClass(),
    marksByClass(),
    feeCollection(),
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.assessment.count({ where: { status: "DIRECTOR_APPROVED" } }),
    prisma.deanRequest.findMany({ where: { status: "PENDING" }, include: { department: true }, orderBy: { createdAt: "asc" } }),
    upcomingEvents(null, istToday(), 5),
  ]);

  const deptRows = await Promise.all(
    depts.map(async (d) => {
      const cs = classes.filter((c) => c.departmentId === d.id);
      const att = cs.reduce((a, c) => ({ p: a.p + c.present, t: a.t + c.total }), { p: 0, t: 0 });
      const mk = cs.reduce(
        (a, c) => {
          const m = marks.get(c.id);
          return m ? { got: a.got + m.got, max: a.max + m.max, pass: a.pass + m.pass, n: a.n + m.n } : a;
        },
        { got: 0, max: 0, pass: 0, n: 0 },
      );
      const [low, pending, fee] = await Promise.all([lowAttendanceInDepartment(d.id), directorPending(d.id), feeCollection(d.id)]);
      return { d, classes: cs.length, att: percent(att.p, att.t), avg: mk.max ? percent(mk.got, mk.max) : null, pass: mk.n ? percent(mk.pass, mk.n) : null, low: low.low.length, pending: pending.length, fee: fee.pct };
    }),
  );
  const totalAtt = classes.reduce((a, c) => ({ p: a.p + c.present, t: a.t + c.total }), { p: 0, t: 0 });

  return (
    <>
      <PageHeader title={`${greeting()}, ${session.name}`} subtitle={`${COLLEGE_NAME} · ${formatLong(istToday())}`} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <Kpi label="Students" value={students} />
        <Kpi label="Teachers" value={teachers} />
        <Kpi label="Departments" value={depts.length} />
        <Kpi label="Average attendance" value={pct(percent(totalAtt.p, totalAtt.t))} />
        <Kpi label="Fees collected" value={pct(fees.pct)} hint={`${rupees(fees.paid)} of ${rupees(fees.total)}`} />
      </div>

      {(results > 0 || requests.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {results > 0 && (
            <Link href="/dean/results" className="card flex items-center justify-between gap-3 border-warn-50 bg-warn-50 hover:border-warn-800">
              <span>
                <b className="text-lg">{results} results ready to publish</b>
                <span className="block text-sm text-warn-900">Approved by Directors, waiting for you</span>
              </span>
              <span className="btn btn-sm">Review</span>
            </Link>
          )}
          {requests.length > 0 && (
            <Link href="/dean/requests" className="card flex items-center justify-between gap-3 border-warn-50 bg-warn-50 hover:border-warn-800">
              <span>
                <b className="text-lg">{requests.length} requests from Directors</b>
                <span className="block text-sm text-warn-900">{requests.map((r) => r.department.id).join(", ")}</span>
              </span>
              <span className="btn btn-sm">Review</span>
            </Link>
          )}
        </div>
      )}

      <Card title="Department comparison">
        <div className="-mx-4 overflow-x-auto">
          <table className="table min-w-[820px]">
            <thead>
              <tr>
                <th>Department</th>
                <th>Director</th>
                <th>Classes</th>
                <th>Attendance</th>
                <th>Average marks</th>
                <th>Pass rate</th>
                <th>Below 75%</th>
                <th>Fees</th>
                <th>Director&apos;s pending</th>
              </tr>
            </thead>
            <tbody>
              {deptRows.map((r) => (
                <tr key={r.d.id}>
                  <td className="font-extrabold">{r.d.name}</td>
                  <td>{r.d.director?.name ?? <span className="pill pill-red">None</span>}</td>
                  <td>{r.classes}</td>
                  <td className={r.att < ATTENDANCE_THRESHOLD ? "font-bold text-danger" : "font-bold"}>{pct(r.att)}</td>
                  <td>{r.avg != null ? pct(r.avg) : "–"}</td>
                  <td>{r.pass != null ? pct(r.pass) : "–"}</td>
                  <td className={r.low ? "font-bold text-danger" : ""}>{r.low}</td>
                  <td>{pct(r.fee)}</td>
                  <td>{r.pending ? <span className={`pill ${r.pending >= 3 ? "pill-red" : "pill-amber"}`}>{r.pending} pending</span> : <span className="pill pill-green">Up to date</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Attendance by class">
          <div className="flex flex-col gap-3 py-1">
            {classes.map((c) => (
              <Bar key={c.id} label={c.id} value={c.pct} width={90} />
            ))}
          </div>
        </Card>
        <Card title="Upcoming">
          {events.length === 0 ? (
            <Empty>Nothing scheduled.</Empty>
          ) : (
            events.map((e) => (
              <div key={e.id} className="row">
                <span>
                  {e.title}
                  <span className="block text-xs text-ink-muted">{e.departmentId ?? "Whole college"}</span>
                </span>
                <b className="text-[color:var(--accent)]">{formatDay(e.date)}</b>
              </div>
            ))
          )}
        </Card>
      </div>
    </>
  );
}
