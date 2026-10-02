import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { addDays, formatDate, formatDateTime, istToday } from "@/lib/dates";
import { getNoticesFor } from "@/lib/queries/student";
import { getParentAndChild } from "../data";
import { MessagesPageContent } from "./MessagesPageContent";

export const metadata: Metadata = { title: "Messages" };

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export default async function MessagesPage() {
  const { session, child } = await getParentAndChild();
  if (!child) return null;

  const [messages, meetings, notices] = await Promise.all([
    prisma.message.findMany({
      where: { OR: [{ toId: session.userId }, { fromId: session.userId }] },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: { from: { select: { name: true } } },
    }),
    prisma.meetingRequest.findMany({
      where: { parentId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { teacher: { include: { user: { select: { name: true } } } } },
    }),
    getNoticesFor("PARENTS", child.class.departmentId, 30),
  ]);
  const proctor = child.class.proctor?.user;
  const hasUnread = messages.some((m) => m.toId === session.userId && !m.readAt);
  const today = istToday();

  return (
    <MessagesPageContent
      userId={session.userId}
      messages={messages.map((m) => ({
        id: m.id,
        fromId: m.fromId,
        toId: m.toId,
        body: m.body,
        fromName: m.from.name,
        createdAtStr: formatDateTime(m.createdAt),
        readAt: m.readAt?.toISOString() ?? null,
      }))}
      meetings={meetings.map((m) => ({
        id: m.id,
        preferredDateStr: formatDate(m.preferredDate),
        reason: m.reason,
        status: m.status,
        reply: m.reply,
        teacherName: m.teacher.user.name,
      }))}
      notices={notices.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        authorName: n.author.name,
        createdAtStr: formatDateTime(n.createdAt),
      }))}
      proctorName={proctor?.name ?? null}
      hasUnread={hasUnread}
      minDate={isoDate(addDays(today, 1))}
      maxDate={isoDate(addDays(today, 30))}
    />
  );
}
