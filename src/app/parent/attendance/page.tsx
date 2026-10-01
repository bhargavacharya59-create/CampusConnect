import type { Metadata } from "next";
import { ATTENDANCE_THRESHOLD, PERIODS } from "@/lib/constants";
import { formatDay } from "@/lib/dates";
import { pct, plural } from "@/lib/format";
import { getAttendance } from "@/lib/queries/student";
import { getParentAndChild } from "../data";
import { AttendanceBar, Empty, SectionTitle } from "../ui";

export const metadata: Metadata = { title: "Attendance" };

export default async function AttendancePage() {
  const { child } = await getParentAndChild();
  if (!child) return null;
  const att = await getAttendance(child.id);
  const low = att.pct < ATTENDANCE_THRESHOLD;
  const name = child.user.name.split(" ")[0];

  // Group absences by date (most recent first).
  const byDate = new Map<number, { date: Date; items: { period: number; subject: string }[] }>();
  for (const a of att.absences) {
    const key = a.date.getTime();
    if (!byDate.has(key)) byDate.set(key, { date: a.date, items: [] });
    byDate.get(key)!.items.push({ period: a.period, subject: a.subject });
  }
  const days = [...byDate.values()].slice(0, 15);

  return (
    <>
      <section className="card shadow-[0_10px_24px_rgba(11,61,58,0.10)]">
        <h1 className="sr-only">Attendance</h1>
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-ink-muted">Overall attendance</div>
            <div className={`text-4xl font-extrabold ${low ? "text-danger" : ""}`}>{pct(att.pct)}</div>
          </div>
          <div className="text-right text-sm text-ink-muted">
            {att.present} of {att.total} classes
            <br />
            Minimum {ATTENDANCE_THRESHOLD}%
          </div>
        </div>
        <p className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${low ? "bg-alert-100 text-alert-800" : "bg-ok-50 text-ok-900"}`}>
          {low
            ? `${name} must attend the next ${plural(att.needed, "class", "classes")} in a row to reach ${ATTENDANCE_THRESHOLD}%.`
            : att.canMiss > 0
              ? `${name} is above ${ATTENDANCE_THRESHOLD}%. Missing more than ${plural(att.canMiss, "class", "classes")} would drop below it.`
              : `${name} is exactly at the limit. Missing any class will drop below ${ATTENDANCE_THRESHOLD}%.`}
        </p>
      </section>

      <section className="card">
        <SectionTitle>Subject-wise</SectionTitle>
        {att.subjects.length === 0 ? (
          <Empty>No attendance recorded yet.</Empty>
        ) : (
          att.subjects.map((s) => <AttendanceBar key={s.subjectId} label={s.name} value={s.pct} sub={`${s.present} of ${s.total} classes`} />)
        )}
        <p className="mt-2 text-xs text-ink-muted">The small line on each bar marks {ATTENDANCE_THRESHOLD}%.</p>
      </section>

      <section className="card">
        <SectionTitle>Recent absences</SectionTitle>
        {days.length === 0 ? (
          <Empty>No absences. Great!</Empty>
        ) : (
          days.map((d) => (
            <div key={d.date.getTime()} className="border-b border-line-soft py-2.5 last:border-b-0">
              <div className="text-sm font-extrabold">{formatDay(d.date)}</div>
              <ul className="mt-1 flex flex-col gap-0.5">
                {d.items
                  .sort((a, b) => a.period - b.period)
                  .map((i) => (
                    <li key={i.period} className="flex justify-between text-sm">
                      <span>{i.subject}</span>
                      <span className="text-ink-muted">
                        P{i.period} · {PERIODS[i.period]?.start}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </>
  );
}
