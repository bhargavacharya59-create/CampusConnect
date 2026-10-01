// Notices + calendar editor used by Director (department) and Dean (college).
import { EVENT_KINDS } from "@/lib/constants";
import { formatDateTime, formatDay, isoDate, istToday } from "@/lib/dates";
import type { FormState } from "@/app/actions/auth";
import { Card, Empty } from "./ui";
import { ActionForm, InlineAction, SubmitButton } from "./forms";

type Action = (prev: FormState, data: FormData) => Promise<FormState>;

export function NoticeBoard({
  notices,
  events,
  postNotice,
  addEvent,
  deleteEvent,
  canDelete,
  scopeLabel,
}: {
  notices: { id: string; title: string; body: string; audience: string; createdAt: Date; author: { name: string }; departmentId: string | null }[];
  events: { id: string; title: string; date: Date; kind: string; departmentId: string | null }[];
  postNotice: Action;
  addEvent: Action;
  deleteEvent: Action;
  canDelete: (e: { departmentId: string | null }) => boolean;
  scopeLabel: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-4">
        <Card title={`Post a notice · ${scopeLabel}`}>
          <ActionForm action={postNotice}>
            <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="n-title" className="label">
                  Title
                </label>
                <input id="n-title" name="title" required maxLength={120} className="field" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="n-aud" className="label">
                  Who sees it
                </label>
                <select id="n-aud" name="audience" className="field">
                  <option value="ALL">Everyone</option>
                  <option value="STUDENTS">Students</option>
                  <option value="PARENTS">Parents</option>
                  <option value="STAFF">Staff</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="n-body" className="label">
                Message
              </label>
              <textarea id="n-body" name="body" rows={4} required maxLength={3000} className="field h-auto py-2.5" />
            </div>
            <div>
              <SubmitButton busy="Posting…">Post notice</SubmitButton>
            </div>
          </ActionForm>
        </Card>
        <Card title="Recent notices">
          {notices.length === 0 ? (
            <Empty>No notices yet.</Empty>
          ) : (
            notices.map((n) => (
              <article key={n.id} className="border-b border-line-soft py-3 last:border-b-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-extrabold">{n.title}</h3>
                  <span className="pill pill-gray">{n.audience === "ALL" ? "Everyone" : n.audience.charAt(0) + n.audience.slice(1).toLowerCase()}</span>
                </div>
                <p className="mt-1 text-sm text-ink-soft">{n.body}</p>
                <div className="mt-1 text-xs text-ink-muted">
                  {n.author.name} · {n.departmentId ?? "Whole college"} · {formatDateTime(n.createdAt)}
                </div>
              </article>
            ))
          )}
        </Card>
      </div>
      <Card title="Calendar">
        <ActionForm action={addEvent}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="e-title" className="label">
              Event
            </label>
            <input id="e-title" name="title" required maxLength={120} className="field" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="e-date" className="label">
                Date
              </label>
              <input id="e-date" name="date" type="date" defaultValue={isoDate(istToday())} required className="field" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="e-kind" className="label">
                Type
              </label>
              <select id="e-kind" name="kind" className="field">
                {Object.entries(EVENT_KINDS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <SubmitButton busy="Adding…" className="btn-outline">
            Add to calendar
          </SubmitButton>
        </ActionForm>
        <div className="mt-4 border-t border-line-soft pt-2">
          {events.length === 0 ? (
            <Empty>No upcoming events.</Empty>
          ) : (
            events.map((e) => (
              <div key={e.id} className="row">
                <span className="min-w-0">
                  <span className="block font-semibold">{e.title}</span>
                  <span className="block text-xs text-ink-muted">
                    {EVENT_KINDS[e.kind as keyof typeof EVENT_KINDS] ?? e.kind} · {e.departmentId ?? "Whole college"}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <b className="text-[color:var(--accent)]">{formatDay(e.date)}</b>
                  {canDelete(e) && <InlineAction action={deleteEvent} fields={{ eventId: e.id }} label="Delete" className="btn-outline btn-sm" confirm="Delete this event?" />}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
