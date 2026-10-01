import type { Metadata } from "next";
import { EVENT_KINDS } from "@/lib/constants";
import { formatDateTime, formatDay, istToday } from "@/lib/dates";
import { getNoticesFor } from "@/lib/queries/student";
import { upcomingEvents } from "@/lib/queries/staff";
import { Card, Empty, PageHeader } from "@/components/ui";
import { getMe } from "../data";

export const metadata: Metadata = { title: "Notices" };

export default async function StudentNotices() {
  const { me } = await getMe();
  const [notices, events] = await Promise.all([getNoticesFor("STUDENTS", me.class.departmentId, 40), upcomingEvents(me.class.departmentId, istToday(), 20)]);
  return (
    <>
      <PageHeader title="Notices & calendar" />
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card title="Notices">
          {notices.length === 0 ? (
            <Empty>No notices.</Empty>
          ) : (
            notices.map((n) => (
              <article key={n.id} className="border-b border-line-soft py-3 last:border-b-0">
                <h3 className="font-extrabold">{n.title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{n.body}</p>
                <div className="mt-1 text-xs text-ink-muted">
                  {n.author.name} · {formatDateTime(n.createdAt)}
                </div>
              </article>
            ))
          )}
        </Card>
        <Card title="Upcoming">
          {events.length === 0 ? (
            <Empty>Nothing scheduled.</Empty>
          ) : (
            events.map((e) => (
              <div key={e.id} className="row">
                <span>
                  {e.title}
                  <span className="block text-xs text-ink-muted">{EVENT_KINDS[e.kind as keyof typeof EVENT_KINDS] ?? e.kind}</span>
                </span>
                <b className="shrink-0 text-[color:var(--accent)]">{formatDay(e.date)}</b>
              </div>
            ))
          )}
        </Card>
      </div>
    </>
  );
}
