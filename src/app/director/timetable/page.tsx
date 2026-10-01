import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { isoWeekday, istToday } from "@/lib/dates";
import { Card, PageHeader } from "@/components/ui";
import { TimetableGrid } from "@/components/TimetableGrid";
import { getDept } from "../data";

export const metadata: Metadata = { title: "Timetable" };

export default async function DirectorTimetable({ searchParams }: { searchParams: { class?: string } }) {
  const { dept } = await getDept();
  const classes = await prisma.class.findMany({ where: { departmentId: dept.id }, orderBy: { id: "asc" }, select: { id: true } });
  const selected = classes.find((c) => c.id === searchParams.class)?.id ?? classes[0]?.id;
  const slots = selected
    ? await prisma.timetableSlot.findMany({
        where: { classId: selected },
        include: { assignment: { include: { subject: true, teacher: { include: { user: { select: { name: true } } } } } } },
      })
    : [];
  return (
    <>
      <PageHeader title="Timetable" subtitle="Weekly timetable by class" />
      <div className="flex flex-wrap gap-2">
        {classes.map((c) => (
          <Link key={c.id} href={`/director/timetable?class=${c.id}`} className={c.id === selected ? "btn btn-sm" : "btn-outline btn-sm"} aria-current={c.id === selected ? "page" : undefined}>
            {c.id}
          </Link>
        ))}
      </div>
      <Card title={selected}>
        <TimetableGrid
          today={isoWeekday(istToday())}
          cells={slots.map((s) => ({ day: s.day, period: s.period, title: s.assignment.subject.shortName, sub: `${s.assignment.teacher.user.name.replace(/^Prof\.\s*/, "")} · ${s.room}` }))}
        />
      </Card>
    </>
  );
}
