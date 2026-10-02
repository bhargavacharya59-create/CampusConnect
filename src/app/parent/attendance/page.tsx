import type { Metadata } from "next";
import { ATTENDANCE_THRESHOLD, PERIODS } from "@/lib/constants";
import { formatDay } from "@/lib/dates";
import { pct } from "@/lib/format";
import { getAttendance } from "@/lib/queries/student";
import { getParentAndChild } from "../data";
import { AttendanceContent } from "./AttendanceContent";

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
    <AttendanceContent
      pct={att.pct}
      pctFormatted={pct(att.pct)}
      present={att.present}
      total={att.total}
      needed={att.needed}
      canMiss={att.canMiss}
      threshold={ATTENDANCE_THRESHOLD}
      low={low}
      firstName={name}
      subjects={att.subjects.map((s) => ({
        subjectId: s.subjectId,
        name: s.name,
        pct: s.pct,
        present: s.present,
        total: s.total,
      }))}
      absences={days.map((d) => ({
        dateTime: d.date.getTime(),
        dateFormatted: formatDay(d.date),
        items: d.items.map((i) => ({
          period: i.period,
          subject: i.subject,
          periodStart: PERIODS[i.period]?.start ?? "",
        })),
      }))}
    />
  );
}
