import Link from "next/link";
import { prisma } from "@/lib/db";
import { ATTENDANCE_THRESHOLD } from "@/lib/constants";
import { formatDay, formatDateTime, istToday, weekStart } from "@/lib/dates";
import { pct, plural, rupees } from "@/lib/format";
import { getAttendance, getFees, getNoticesFor, getPublishedMarks, getToday } from "@/lib/queries/student";
import { isAiEnabled } from "@/lib/ai/gemini";
import { AlertIcon, ChevronRightIcon, SparkleIcon } from "@/components/icons";
import { getParentAndChild } from "./data";
import { SummaryButton } from "./SummaryButton";
import { Empty, PeriodPill, SectionTitle } from "./ui";

export default async function ParentHome() {
  const { session, child } = await getParentAndChild();
  if (!child) return null;

  const [att, today, marks, fees, notices, latestMsg] = await Promise.all([
    getAttendance(child.id),
    getToday(child.classId, child.id),
    getPublishedMarks(child.classId, child.id),
    getFees(child.id),
    getNoticesFor("PARENTS", child.class.departmentId, 3),
    prisma.message.findFirst({
      where: { toId: session.userId, readAt: null },
      orderBy: { createdAt: "desc" },
      include: { from: { select: { name: true } } },
    }),
  ]);
  const low = att.pct < ATTENDANCE_THRESHOLD;
  const proctor = child.class.proctor?.user;
  const aiOn = isAiEnabled("PARENT");
  const summary = aiOn
    ? await prisma.aiSummary.findUnique({
        where: { studentId_kind_periodStart: { studentId: child.id, kind: "PARENT_WEEKLY", periodStart: weekStart(istToday()) } },
      })
    : null;

  return (
    <>
      {/* Summary */}
      <section aria-label="Summary" className="card grid grid-cols-3 text-center shadow-[0_10px_24px_rgba(11,61,58,0.10)]">
        <Link href="/parent/attendance" className="rounded-xl py-1 hover:bg-ground">
          <div className={`text-[22px] font-extrabold ${low ? "text-danger" : ""}`}>{pct(att.pct)}</div>
          <div className="text-xs font-semibold text-ink-muted">Attendance</div>
        </Link>
        <Link href="/parent/marks" className="rounded-xl border-x border-line-soft py-1 hover:bg-ground">
          <div className="text-[22px] font-extrabold">{marks.pct != null ? pct(marks.pct) : "–"}</div>
          <div className="text-xs font-semibold text-ink-muted">Marks</div>
        </Link>
        <Link href="/parent/fees" className="rounded-xl py-1 hover:bg-ground">
          <div className={`text-[22px] font-extrabold ${fees.dueTotal ? "text-warn-800" : "text-ok-700"}`}>{fees.dueTotal ? rupees(fees.dueTotal) : "Paid"}</div>
          <div className="text-xs font-semibold text-ink-muted">Fee due</div>
        </Link>
      </section>

      {child.parent.mustChangePassword && (
        <Link href="/parent/account" className="flex items-center justify-between gap-3 rounded-2xl border border-warn-50 bg-warn-50 px-4 py-3 text-sm text-warn-900">
          <span>
            <b>You&apos;re using the default password.</b> Change it to keep your account safe.
          </span>
          <ChevronRightIcon size={18} />
        </Link>
      )}

      {low && (
        <section className="flex gap-3 rounded-2xl border border-alert-200 bg-alert-100 p-3.5 text-alert-800" role="alert">
          <AlertIcon className="mt-0.5 shrink-0" />
          <div>
            <div className="font-extrabold">Attendance below {ATTENDANCE_THRESHOLD}%</div>
            <p className="mt-0.5 text-[13px] text-[#5C1A12]">
              {child.user.name.split(" ")[0]} needs to attend the next {plural(att.needed, "class", "classes")} without a break to reach {ATTENDANCE_THRESHOLD}%.
            </p>
          </div>
        </section>
      )}

      {/* AI */}
      <section className="card border-brand-100">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <SparkleIcon size={16} />
          </div>
          <h2 className="text-[15px] font-extrabold">AI progress summary</h2>
        </div>
        {!aiOn ? (
          <p className="text-sm text-ink-muted">AI features will appear here once the college switches them on.</p>
        ) : (
          <>
            {summary ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{summary.text}</p>
            ) : (
              <SummaryButton />
            )}
            <Link href="/parent/assistant" className="btn mt-3 w-full">
              Ask AI about {child.user.name.split(" ")[0]}
            </Link>
            <p className="mt-2 text-center text-[11px] text-ink-muted">AI can make mistakes. Check important details with the proctor.</p>
          </>
        )}
      </section>

      {latestMsg && (
        <Link href="/parent/messages" className="card flex items-start gap-3 border-brand-100 bg-brand-50 hover:border-brand-600">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-brand-700">New message · {latestMsg.from.name}</div>
            <p className="mt-0.5 line-clamp-2 text-sm">{latestMsg.body}</p>
          </div>
          <ChevronRightIcon size={18} className="mt-1 shrink-0 text-brand-700" />
        </Link>
      )}

      {/* Today */}
      <section className="card">
        <SectionTitle>Today · {formatDay(today.date)}</SectionTitle>
        {today.holiday ? (
          <Empty>No classes today.</Empty>
        ) : (
          today.periods.map((p) => (
            <div key={p.period} className="row">
              <div className="min-w-0">
                <div className="font-semibold">
                  <span className="mr-1.5 font-extrabold text-brand-700">{p.start}</span>
                  {p.subject}
                </div>
                <div className="truncate text-xs text-ink-muted">
                  {p.teacher} · {p.room}
                </div>
              </div>
              <PeriodPill status={p.status} />
            </div>
          ))
        )}
      </section>

      {/* Latest marks */}
      <section className="card">
        <SectionTitle
          action={
            <Link href="/parent/marks" className="text-[13px] font-bold">
              All marks
            </Link>
          }
        >
          Latest marks
        </SectionTitle>
        {marks.items.length === 0 ? (
          <Empty>No marks published yet.</Empty>
        ) : (
          marks.items.slice(0, 4).map((m) => (
            <div key={m.id} className="row">
              <span>
                {m.subject.name} <span className="text-ink-muted">· {m.name}</span>
              </span>
              <b>{m.absent ? "Absent" : `${m.score ?? "–"} / ${m.maxMarks}`}</b>
            </div>
          ))
        )}
      </section>

      {/* Fees */}
      {fees.nextDue && (
        <section className="card flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-ink-muted">
              {fees.nextDue.state === "OVERDUE" ? "Overdue since" : "Next due"} {formatDay(fees.nextDue.dueDate)}
            </div>
            <div className={`text-xl font-extrabold ${fees.nextDue.state === "OVERDUE" ? "text-danger" : "text-warn-800"}`}>{rupees(fees.nextDue.amount)}</div>
            <div className="text-xs text-ink-muted">{fees.nextDue.title}</div>
          </div>
          <Link href="/parent/fees" className="btn shrink-0">
            View fees
          </Link>
        </section>
      )}

      {/* Proctor */}
      {proctor && (
        <section className="card flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-ink-muted">Proctor (class mentor)</div>
            <div className="font-extrabold">{proctor.name}</div>
          </div>
          <Link href="/parent/messages#meeting" className="btn shrink-0">
            Request meeting
          </Link>
        </section>
      )}

      {/* Notices */}
      <section className="card">
        <SectionTitle
          action={
            <Link href="/parent/messages#notices" className="text-[13px] font-bold">
              All notices
            </Link>
          }
        >
          Notices
        </SectionTitle>
        {notices.length === 0 ? (
          <Empty>No notices.</Empty>
        ) : (
          notices.map((n) => (
            <div key={n.id} className="border-b border-line-soft py-2.5 last:border-b-0">
              <div className="text-sm font-bold">{n.title}</div>
              <div className="text-xs text-ink-muted">
                {n.author.name} · {formatDateTime(n.createdAt)}
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}
