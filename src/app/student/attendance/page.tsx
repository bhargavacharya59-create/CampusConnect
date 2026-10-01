import type { Metadata } from "next";
import { ATTENDANCE_THRESHOLD, PERIODS } from "@/lib/constants";
import { formatDay } from "@/lib/dates";
import { pct } from "@/lib/format";
import { getAttendance } from "@/lib/queries/student";
import { Bar, Card, Empty, Kpi, KpiGrid, PageHeader } from "@/components/ui";
import { getMe } from "../data";

export const metadata: Metadata = { title: "Attendance" };

export default async function StudentAttendance() {
  const { me } = await getMe();
  const att = await getAttendance(me.id);
  const low = att.pct < ATTENDANCE_THRESHOLD;
  return (
    <>
      <PageHeader title="Attendance" subtitle={`Minimum ${ATTENDANCE_THRESHOLD}% in every subject to sit the semester exam`} />
      <KpiGrid>
        <Kpi label="Overall" value={pct(att.pct)} danger={low} />
        <Kpi label="Classes attended" value={`${att.present}/${att.total}`} />
        <Kpi label={low ? "Classes needed in a row" : "Classes you can still miss"} value={low ? att.needed : att.canMiss} danger={low} />
        <Kpi label="Absences" value={att.absences.length} />
      </KpiGrid>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Subject-wise">
          <div className="flex flex-col gap-3 py-1">
            {att.subjects.map((s) => (
              <Bar key={s.subjectId} label={s.name} value={s.pct} sub={`${s.present}/${s.total}`} width={170} />
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-muted">The small line marks {ATTENDANCE_THRESHOLD}%.</p>
        </Card>
        <Card title="Absences">
          {att.absences.length === 0 ? (
            <Empty>No absences. Great!</Empty>
          ) : (
            att.absences.slice(0, 30).map((a, i) => (
              <div key={i} className="row">
                <span>{a.subject}</span>
                <span className="text-ink-muted">
                  {formatDay(a.date)} · {PERIODS[a.period]?.start}
                </span>
              </div>
            ))
          )}
        </Card>
      </div>
    </>
  );
}
