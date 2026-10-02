"use client";

import { useI18n } from "@/lib/i18n/context";
import { MarkRead, MeetingForm, MessageForm } from "./forms";

interface MessagesPageContentProps {
  userId: string;
  messages: { id: string; fromId: string; toId: string; body: string; fromName: string; createdAtStr: string; readAt: string | null }[];
  meetings: { id: string; preferredDateStr: string; reason: string; status: string; reply: string | null; teacherName: string }[];
  notices: { id: string; title: string; body: string; authorName: string; createdAtStr: string }[];
  proctorName: string | null;
  hasUnread: boolean;
  minDate: string;
  maxDate: string;
}

export function MessagesPageContent(props: MessagesPageContentProps) {
  const { t } = useI18n();
  const { userId, messages, meetings, notices, proctorName, hasUnread, minDate, maxDate } = props;

  const MEETING_STATUS: Record<string, { labelKey: "waiting" | "accepted" | "declined"; cls: string }> = {
    PENDING: { labelKey: "waiting", cls: "pill-amber" },
    ACCEPTED: { labelKey: "accepted", cls: "pill-green" },
    DECLINED: { labelKey: "declined", cls: "pill-red" },
  };

  return (
    <>
      <MarkRead hasUnread={hasUnread} />

      <section className="card shadow-[0_10px_24px_rgba(11,61,58,0.10)]">
        <h1 className="sr-only">{t("messages")}</h1>
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-extrabold">{t("messagesWithTeachers")}</h2>
        </div>
        {messages.length === 0 ? (
          <p className="py-3 text-center text-sm text-ink-muted">{t("noMessagesYet")}</p>
        ) : (
          <ol className="flex flex-col gap-2.5 py-1">
            {messages.map((m) => {
              const mine = m.fromId === userId;
              return (
                <li key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${mine ? "rounded-br-md bg-brand-600 text-white" : "rounded-bl-md bg-ground"}`}>
                    {m.body}
                  </div>
                  <div className="mt-1 text-[11px] text-ink-muted">
                    {mine ? t("you") : m.fromName} · {m.createdAtStr}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {proctorName ? <MessageForm proctorName={proctorName} /> : <p className="py-3 text-center text-sm text-ink-muted">{t("noMessagesYet")}</p>}
      </section>

      {proctorName && (
        <section id="meeting" className="card scroll-mt-4">
          <div className="mb-1 flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-extrabold">{t("requestMeetingWithProctor")}</h2>
          </div>
          <p className="mb-3 text-sm text-ink-muted">{t("meetingProctorDesc", { name: proctorName })}</p>
          <MeetingForm min={minDate} max={maxDate} />
          {meetings.length > 0 && (
            <div className="mt-4 border-t border-line-soft pt-2">
              <div className="mb-1 text-xs font-bold uppercase tracking-wide text-ink-muted">{t("yourRequests")}</div>
              {meetings.map((m) => {
                const s = MEETING_STATUS[m.status] ?? MEETING_STATUS.PENDING;
                return (
                  <div key={m.id} className="border-b border-line-soft py-2.5 text-sm last:border-b-0">
                    <div className="flex items-center justify-between gap-3">
                      <b>{m.preferredDateStr}</b>
                      <span className={`pill ${s.cls}`}>{t(s.labelKey)}</span>
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
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-extrabold">{t("noticesFromCollege")}</h2>
        </div>
        {notices.length === 0 ? (
          <p className="py-3 text-center text-sm text-ink-muted">{t("noNotices")}</p>
        ) : (
          notices.map((n) => (
            <article key={n.id} className="border-b border-line-soft py-3 last:border-b-0">
              <h3 className="text-sm font-extrabold">{n.title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{n.body}</p>
              <div className="mt-1 text-xs text-ink-muted">
                {n.authorName} · {n.createdAtStr}
              </div>
            </article>
          ))
        )}
      </section>
    </>
  );
}
