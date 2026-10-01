import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { addDays, formatDate, formatDateTime, istToday } from "@/lib/dates";
import { getNoticesFor } from "@/lib/queries/student";
import { getParentAndChild } from "../data";
import { Empty, SectionTitle } from "../ui";
import { MarkRead, MeetingForm, MessageForm } from "./forms";

export const metadata: Metadata = { title: "Messages" };

const MEETING_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Waiting", cls: "pill-amber" },
  ACCEPTED: { label: "Accepted", cls: "pill-green" },
  DECLINED: { label: "Declined", cls: "pill-red" },
};

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
    <>
      <MarkRead hasUnread={hasUnread} />

      <section className="card shadow-[0_10px_24px_rgba(11,61,58,0.10)]">
        <h1 className="sr-only">Messages</h1>
        <SectionTitle>Messages with teachers</SectionTitle>
        {messages.length === 0 ? (
          <Empty>No messages yet.</Empty>
        ) : (
          <ol className="flex flex-col gap-2.5 py-1">
            {messages.map((m) => {
              const mine = m.fromId === session.userId;
              return (
                <li key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${mine ? "rounded-br-md bg-brand-600 text-white" : "rounded-bl-md bg-ground"}`}>
                    {m.body}
                  </div>
                  <div className="mt-1 text-[11px] text-ink-muted">
                    {mine ? "You" : m.from.name} · {formatDateTime(m.createdAt)}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {proctor ? <MessageForm proctorName={proctor.name} /> : <Empty>No proctor assigned yet.</Empty>}
      </section>

      {proctor && (
        <section id="meeting" className="card scroll-mt-4">
          <SectionTitle>Request a meeting with the proctor</SectionTitle>
          <p className="mb-3 text-sm text-ink-muted">{proctor.name} will accept or suggest another time.</p>
          <MeetingForm min={isoDate(addDays(today, 1))} max={isoDate(addDays(today, 30))} />
          {meetings.length > 0 && (
            <div className="mt-4 border-t border-line-soft pt-2">
              <div className="mb-1 text-xs font-bold uppercase tracking-wide text-ink-muted">Your requests</div>
              {meetings.map((m) => {
                const s = MEETING_STATUS[m.status] ?? MEETING_STATUS.PENDING;
                return (
                  <div key={m.id} className="border-b border-line-soft py-2.5 text-sm last:border-b-0">
                    <div className="flex items-center justify-between gap-3">
                      <b>{formatDate(m.preferredDate)}</b>
                      <span className={`pill ${s.cls}`}>{s.label}</span>
                    </div>
                    <div className="text-ink-muted">{m.reason}</div>
                    {m.reply && <div className="mt-1 rounded-lg bg-ground px-2.5 py-1.5">{m.reply}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      <section id="notices" className="card scroll-mt-4">
        <SectionTitle>Notices from the college</SectionTitle>
        {notices.length === 0 ? (
          <Empty>No notices.</Empty>
        ) : (
          notices.map((n) => (
            <article key={n.id} className="border-b border-line-soft py-3 last:border-b-0">
              <h3 className="text-sm font-extrabold">{n.title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{n.body}</p>
              <div className="mt-1 text-xs text-ink-muted">
                {n.author.name} · {formatDateTime(n.createdAt)}
              </div>
            </article>
          ))
        )}
      </section>
    </>
  );
}
