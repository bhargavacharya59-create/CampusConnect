import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { isoWeekday, istToday } from "@/lib/dates";
import { Card, PageHeader } from "@/components/ui";
import { TimetableGrid } from "@/components/TimetableGrid";
import { getMe } from "../data";

export const metadata: Metadata = { title: "Timetable" };

export default async function StudentTimetable() {
  const { me } = await getMe();
  const slots = await prisma.timetableSlot.findMany({
    where: { classId: me.classId },
    include: { assignment: { include: { subject: true, teacher: { include: { user: { select: { name: true } } } } } } },
  });
  return (
    <>
      <PageHeader title={`Timetable · ${me.class.name}`} />
      <Card>
        <TimetableGrid
          today={isoWeekday(istToday())}
          cells={slots.map((s) => ({ day: s.day, period: s.period, title: s.assignment.subject.shortName, sub: `${s.assignment.teacher.user.name.replace(/^Prof\.\s*/, "")} · ${s.room}` }))}
        />
      </Card>
    </>
  );
}
