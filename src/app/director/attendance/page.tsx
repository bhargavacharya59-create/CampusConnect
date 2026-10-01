import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ATTENDANCE_THRESHOLD } from "@/lib/constants";
import { addDays, formatDate, istToday } from "@/lib/dates";
import { pct } from "@/lib/format";
import { lowAttendanceInDepartment } from "@/lib/pending";
import { Card, Empty, Kpi, KpiGrid, PageHeader } from "@/components/ui";
import { InlineAction } from "@/components/forms";
import { getDept } from "../data";
import { notifyParents } from "../actions";

export const metadata: Metadata = { title: "Low attendance" };

export default async function DirectorLowAttendance({ searchParams }: { searchParams: { class?: string } }) {
  const { dept } = await getDept();
  const { low } = await lowAttendanceInDepartment(dept.id);
  const ids = low.map((l) => l.studentId);
  const [students, lastMsgs, classes] = await Promise.all([
    prisma.student.findMany({
      where: { id: { in: ids } },
      select: { id: true, classId: true, rollNo: true, user: { select: { name: true } }, parent: { select: { name: true, phone: true } }, class: { select: { proctor: { select: { user: { select: { name: true } } } } } } },
    }),
    prisma.message.groupBy({ by: ["studentId"], where: { studentId: { in: ids }, to: { role: "PARENT" } }, _max: { createdAt: true } }),
    prisma.class.findMany({ where: { departmentId: dept.id }, select: { id: true }, orderBy: { id: "asc" } }),
  ]);
  const byId = new Map<string, (typeof students)[number]>(students.map((s) => [s.id, s]));
  const lastMsg = new Map<string, Date | null>(lastMsgs.map((m) => [m.studentId as string, m._max.createdAt as Date | null]));
  const weekAgo = addDays(istToday(), -7);
  let rows = low.map((l) => ({ ...l, s: byId.get(l.studentId)!, last: lastMsg.get(l.studentId) ?? null })).filter((r) => r.s);
  if (searchParams.class) rows = rows.filter((r) => r.s.classId === searchParams.class);
  rows.sort((a, b) => a.pct - b.pct);
  const unnotified = low.filter((l) => !(lastMsg.get(l.studentId) && lastMsg.get(l.studentId)! >= weekAgo)).length;

  return (
    <>
      <PageHeader
        title="Low attendance"
        subtitle={`Students in ${dept.name} below ${ATTENDANCE_THRESHOLD}% overall`}
        actions={
          unnotified > 0 && (
            <InlineAction action={notifyParents} fields={{}} label={`Inform all ${unnotified} parents`} busy="Sending…" className="btn" confirm={`Send an attendance warning to ${unnotified} parents?`} />
          )
        }
      />
      <KpiGrid>
        <Kpi label="Below 75%" value={low.length} danger={low.length > 0} />
        <Kpi label="Below 65%" value={low.filter((l) => l.pct < 65).length} danger />
        <Kpi label="Parents not informed (7 days)" value={unnotified} danger={unnotified > 0} />
        <Kpi label="Classes" value={classes.length} />
      </KpiGrid>
      <Card
        title="Students"
        action={
          <form className="flex items-center gap-2" action="/director/attendance">
            <label htmlFor="class" className="sr-only">
              Class
            </label>
            <select id="class" name="class" defaultValue={searchParams.class ?? ""} className="field field-sm w-36">
              <option value="">All classes</option>
              {classes.map((c) => (
                <option key={c.id}>{c.id}</option>
              ))}
            </select>
            <button className="btn-outline btn-sm" type="submit">
              Show
            </button>
          </form>
        }
      >
        {rows.length === 0 ? (
          <Empty>No students below {ATTENDANCE_THRESHOLD}%.</Empty>
        ) : (
          <div className="-mx-4 overflow-x-auto">
            <table className="table min-w-[760px]">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Proctor</th>
                  <th>Attendance</th>
                  <th>Parent</th>
                  <th>Last informed</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const recent = r.last && r.last >= weekAgo;
                  return (
                    <tr key={r.studentId}>
                      <td>
                        <a href={`/director/students/${r.studentId}`} className="font-bold hover:underline">
                          {r.s.user.name}
                        </a>
                        <div className="font-mono text-xs text-ink-muted">{r.studentId}</div>
                      </td>
                      <td>{r.s.classId}</td>
                      <td>{r.s.class.proctor?.user.name ?? "–"}</td>
                      <td className="font-extrabold text-danger">
                        {pct(r.pct)}
                        <span className="block text-xs font-normal text-ink-muted">
                          {r.present}/{r.total}
                        </span>
                      </td>
                      <td>
                        {r.s.parent.name}
                        <span className="block text-xs text-ink-muted">{r.s.parent.phone}</span>
                      </td>
                      <td>{r.last ? <span className={recent ? "pill pill-green" : "pill pill-gray"}>{formatDate(r.last)}</span> : <span className="pill pill-red">Never</span>}</td>
                      <td>{!recent && <InlineAction action={notifyParents} fields={{ studentId: r.studentId }} label="Inform parent" busy="…" className="btn-outline btn-sm" />}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
