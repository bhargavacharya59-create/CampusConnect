import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/dates";
import { Card, Empty, PageHeader, StatusPill } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { MarkRead } from "@/components/MarkRead";
import { getMe } from "../data";
import { answerMeeting, messageParent } from "../actions";

export const metadata: Metadata = { title: "Messages" };

export default async function TeacherMessages() {
  const { teacher } = await getMe();
  const [messages, meetings] = await Promise.all([
    prisma.message.findMany({
      where: { OR: [{ toId: teacher.id }, { fromId: teacher.id }] },
      orderBy: { createdAt: "asc" },
      take: 300,
      include: { from: { select: { name: true } }, to: { select: { name: true } }, student: { select: { id: true, classId: true, user: { select: { name: true } } } } },
    }),
    prisma.meetingRequest.findMany({
      where: { teacherId: teacher.id },
      orderBy: [{ status: "desc" }, { preferredDate: "asc" }],
      take: 30,
      include: { parent: { select: { name: true, phone: true } }, student: { select: { id: true, classId: true, user: { select: { name: true } } } } },
    }),
  ]);

  // Group messages into one thread per student.
  const threads = new Map<string, { studentId: string; student: string; classId: string; items: typeof messages; unread: number; last: Date }>();
  for (const m of messages) {
    if (!m.student) continue;
    const t = threads.get(m.student.id) ?? { studentId: m.student.id, student: m.student.user.name, classId: m.student.classId, items: [], unread: 0, last: m.createdAt };
    t.items.push(m);
    if (m.toId === teacher.id && !m.readAt) t.unread++;
    t.last = m.createdAt;
    threads.set(m.student.id, t);
  }
  const list = [...threads.values()].sort((a, b) => b.unread - a.unread || b.last.getTime() - a.last.getTime());
  const hasUnread = list.some((t) => t.unread > 0);
  const pendingMeetings = meetings.filter((m) => m.status === "PENDING");

  return (
    <>
      <MarkRead hasUnread={hasUnread} />
      <PageHeader title="Messages" subtitle="Conversations with parents, one thread per student" />

      <Card title={`Meeting requests${pendingMeetings.length ? ` · ${pendingMeetings.length} waiting` : ""}`} className="scroll-mt-4">
        <div id="meetings" />
        {meetings.length === 0 ? (
          <Empty>No meeting requests.</Empty>
        ) : (
          meetings.map((m) => (
            <div key={m.id} className="border-b border-line-soft py-3 last:border-b-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <b>{m.parent.name}</b> (parent of {m.student.user.name}, {m.student.classId}) · preferred <b>{formatDate(m.preferredDate)}</b>
                  {m.parent.phone && <span className="text-ink-muted"> · {m.parent.phone}</span>}
                </div>
                <StatusPill status={m.status} />
              </div>
              <p className="mt-1 text-sm text-ink-soft">{m.reason}</p>
              {m.status === "PENDING" ? (
                <ActionForm action={answerMeeting} className="mt-2 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="meetingId" value={m.id} />
                  <div className="flex min-w-[220px] flex-1 flex-col gap-1">
                    <label htmlFor={`reply-${m.id}`} className="text-xs font-bold">
                      Reply (time, place, or another date)
                    </label>
                    <input id={`reply-${m.id}`} name="reply" className="field field-sm" placeholder="e.g. 3:30 pm in the CSE staff room" />
                  </div>
                  <SubmitButton name="decision" value="accept" className="btn btn-sm h-10">
                    Accept
                  </SubmitButton>
                  <SubmitButton name="decision" value="decline" className="btn-outline btn-sm h-10">
                    Decline
                  </SubmitButton>
                </ActionForm>
              ) : (
                m.reply && <p className="mt-1 rounded-lg bg-ground px-3 py-1.5 text-sm">Your reply: {m.reply}</p>
              )}
            </div>
          ))
        )}
      </Card>

      {list.length === 0 ? (
        <Card title="Conversations">
          <Empty>No messages yet. You can message a parent from your proctor class or the AI helper.</Empty>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((t) => (
            <Card key={t.studentId} title={`${t.student} · ${t.classId}`} action={t.unread ? <span className="pill pill-red">{t.unread} new</span> : undefined}>
              <ol className="flex max-h-80 flex-col gap-2 overflow-y-auto py-1">
                {t.items.map((m) => {
                  const mine = m.fromId === teacher.id;
                  return (
                    <li key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${mine ? "rounded-br-md bg-[color:var(--accent)] text-white" : "rounded-bl-md bg-ground"}`}>{m.body}</div>
                      <div className="mt-0.5 text-[11px] text-ink-muted">
                        {mine ? "You" : m.from.name} · {formatDateTime(m.createdAt)}
                      </div>
                    </li>
                  );
                })}
              </ol>
              <ActionForm action={messageParent} className="mt-2 flex items-end gap-2">
                <input type="hidden" name="studentId" value={t.studentId} />
                <label htmlFor={`b-${t.studentId}`} className="sr-only">
                  Reply
                </label>
                <textarea id={`b-${t.studentId}`} name="body" rows={1} required maxLength={1500} placeholder="Write a reply…" className="field h-auto min-h-[44px] flex-1 py-2.5" />
                <SubmitButton busy="…" className="btn h-11">
                  Send
                </SubmitButton>
              </ActionForm>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
