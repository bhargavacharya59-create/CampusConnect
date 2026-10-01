import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { istToday } from "@/lib/dates";
import { PageHeader } from "@/components/ui";
import { NoticeBoard } from "@/components/NoticeBoard";
import { getDept } from "../data";
import { addDeptEvent, deleteDeptEvent, postDeptNotice } from "../actions";

export const metadata: Metadata = { title: "Notices & calendar" };

export default async function DirectorNotices() {
  const { dept } = await getDept();
  const [notices, events] = await Promise.all([
    prisma.notice.findMany({ where: { OR: [{ departmentId: dept.id }, { departmentId: null }] }, orderBy: { createdAt: "desc" }, take: 30, include: { author: { select: { name: true } } } }),
    prisma.event.findMany({ where: { date: { gte: istToday() }, OR: [{ departmentId: dept.id }, { departmentId: null }] }, orderBy: { date: "asc" }, take: 30 }),
  ]);
  return (
    <>
      <PageHeader title="Notices & calendar" subtitle={`Your notices and events go to ${dept.name} only. College-wide items come from the Dean.`} />
      <NoticeBoard
        notices={notices}
        events={events}
        postNotice={postDeptNotice}
        addEvent={addDeptEvent}
        deleteEvent={deleteDeptEvent}
        canDelete={(e) => e.departmentId === dept.id}
        scopeLabel={dept.id}
      />
    </>
  );
}
