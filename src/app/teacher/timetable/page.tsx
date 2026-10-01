import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { isoWeekday, istToday } from "@/lib/dates";
import { Card, PageHeader } from "@/components/ui";
import { TimetableGrid } from "@/components/TimetableGrid";
import { getMe } from "../data";

export const metadata: Metadata = { title: "Timetable" };

export default async function TeacherTimetable() {
  const { teacher } = await getMe();
  const slots = await prisma.timetableSlot.findMany({
    where: { assignment: { teacherId: teacher.id } },
    include: { assignment: { include: { subject: true } } },
  });
  return (
    <>
      <PageHeader title="My timetable" subtitle={`${slots.length} periods a week`} />
      <Card>
        <TimetableGrid
          today={isoWeekday(istToday())}
          cells={slots.map((s) => ({ day: s.day, period: s.period, title: s.assignment.subject.shortName, sub: `${s.assignment.classId} · ${s.room}` }))}
        />
      </Card>
    </>
  );
}
