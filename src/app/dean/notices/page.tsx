import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { istToday } from "@/lib/dates";
import { PageHeader } from "@/components/ui";
import { NoticeBoard } from "@/components/NoticeBoard";
import { addCollegeEvent, deleteEvent, postCollegeNotice } from "../actions";

export const metadata: Metadata = { title: "Notices & calendar" };

export default async function DeanNotices() {
  await requireRole("DEAN");
  const [notices, events] = await Promise.all([
    prisma.notice.findMany({ orderBy: { createdAt: "desc" }, take: 40, include: { author: { select: { name: true } } } }),
    prisma.event.findMany({ where: { date: { gte: istToday() } }, orderBy: { date: "asc" }, take: 40 }),
  ]);
  return (
    <>
      <PageHeader title="Notices & calendar" subtitle="College-wide notices and the academic calendar. Department items are shown too." />
      <NoticeBoard notices={notices} events={events} postNotice={postCollegeNotice} addEvent={addCollegeEvent} deleteEvent={deleteEvent} canDelete={() => true} scopeLabel="whole college" />
    </>
  );
}
