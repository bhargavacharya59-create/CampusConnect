"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { AlertIcon, ChevronRightIcon, SparkleIcon } from "@/components/icons";
import { SummaryButton } from "./SummaryButton";

interface DashboardData {
  att: { pct: number; needed: number };
  marksPct: number | null;
  feeDue: number;
  feeFormatted: string;
  low: boolean;
  childName: string;
  childFirstName: string;
  mustChangePassword: boolean;
  aiOn: boolean;
  summaryText: string | null;
  threshold: number;
  latestMsg: { fromName: string; body: string } | null;
  todayLabel: string;
  todayHoliday: boolean;
  todayPeriods: { period: number; start: string; subject: string; teacher: string; room: string; status: string }[];
  marksItems: { id: string; subjectName: string; name: string; absent: boolean; score: number | null; maxMarks: number }[];
  nextDueFee: { state: string; dueDate: string; amount: string; title: string } | null;
  proctor: { name: string } | null;
  notices: { id: string; title: string; authorName: string; createdAt: string }[];
  pctFormatted: string;
  marksPctFormatted: string;
}

export function ParentDashboard(props: DashboardData) {
  const { t } = useI18n();
  const {
    att, low, childName, childFirstName, mustChangePassword,
    aiOn, summaryText, threshold, latestMsg,
    todayLabel, todayHoliday, todayPeriods,
    marksItems, nextDueFee, proctor, notices,
    pctFormatted, marksPctFormatted, feeDue, feeFormatted,
  } = props;

  const statusLabels: Record<string, string> = {
    PRESENT: t("present"),
    ABSENT: t("absentStatus"),
    NOT_MARKED: t("notMarkedYet"),
    UPCOMING: t("later"),
  };

  const statusCls: Record<string, string> = {
    PRESENT: "pill-green",
    ABSENT: "pill-red",
    NOT_MARKED: "pill-amber",
    UPCOMING: "pill-gray",
  };

  return (
    <>
      {/* Summary */}
      <section aria-label={t("home")} className="card grid grid-cols-3 text-center shadow-[0_10px_24px_rgba(11,61,58,0.10)]">
        <Link href="/parent/attendance" className="rounded-xl py-1 hover:bg-ground">
          <div className={`text-[22px] font-extrabold ${low ? "text-danger" : ""}`}>{pctFormatted}</div>
          <div className="text-xs font-semibold text-ink-muted">{t("attendanceLabel")}</div>
        </Link>
        <Link href="/parent/marks" className="rounded-xl border-x border-line-soft py-1 hover:bg-ground">
          <div className="text-[22px] font-extrabold">{marksPctFormatted}</div>
          <div className="text-xs font-semibold text-ink-muted">{t("marksLabel")}</div>
        </Link>
        <Link href="/parent/fees" className="rounded-xl py-1 hover:bg-ground">
          <div className={`text-[22px] font-extrabold ${feeDue ? "text-warn-800" : "text-ok-700"}`}>{feeDue ? feeFormatted : t("paid")}</div>
          <div className="text-xs font-semibold text-ink-muted">{t("feeDue")}</div>
        </Link>
      </section>

      {mustChangePassword && (
        <Link href="/parent/account" className="flex items-center justify-between gap-3 rounded-2xl border border-warn-50 bg-warn-50 px-4 py-3 text-sm text-warn-900">
          <span>
            <b>{t("defaultPasswordWarning")}</b> {t("defaultPasswordAction")}
          </span>
          <ChevronRightIcon size={18} />
        </Link>
      )}

      {low && (
        <section className="flex gap-3 rounded-2xl border border-alert-200 bg-alert-100 p-3.5 text-alert-800" role="alert">
          <AlertIcon className="mt-0.5 shrink-0" />
          <div>
            <div className="font-extrabold">{t("attendanceBelowThreshold", { threshold })}</div>
            <p className="mt-0.5 text-[13px] text-[#5C1A12]">
              {t("needsToAttend", { name: childFirstName, count: `${att.needed} ${att.needed === 1 ? t("classWord") : t("classesWord")}`, threshold })}
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
          <h2 className="text-[15px] font-extrabold">{t("aiProgressSummary")}</h2>
        </div>
        {!aiOn ? (
          <p className="text-sm text-ink-muted">{t("aiNotSwitchedOn")}</p>
        ) : (
          <>
            {summaryText ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{summaryText}</p>
            ) : (
              <SummaryButton />
            )}
            <Link href="/parent/assistant" className="btn mt-3 w-full">
              {t("askAiAbout", { name: childFirstName })}
            </Link>
            <p className="mt-2 text-center text-[11px] text-ink-muted">{t("aiCanMakeMistakes")}</p>
          </>
        )}
      </section>

      {latestMsg && (
        <Link href="/parent/messages" className="card flex items-start gap-3 border-brand-100 bg-brand-50 hover:border-brand-600">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-brand-700">{t("newMessage")} · {latestMsg.fromName}</div>
            <p className="mt-0.5 line-clamp-2 text-sm">{latestMsg.body}</p>
          </div>
          <ChevronRightIcon size={18} className="mt-1 shrink-0 text-brand-700" />
        </Link>
      )}

      {/* Today */}
      <section className="card">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-extrabold">{t("today")} · {todayLabel}</h2>
        </div>
        {todayHoliday ? (
          <p className="py-3 text-center text-sm text-ink-muted">{t("noClassesToday")}</p>
        ) : (
          todayPeriods.map((p) => (
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
              <span className={`pill ${statusCls[p.status] ?? "pill-gray"}`}>{statusLabels[p.status] ?? p.status}</span>
            </div>
          ))
        )}
      </section>

      {/* Latest marks */}
      <section className="card">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-extrabold">{t("latestMarks")}</h2>
          <Link href="/parent/marks" className="text-[13px] font-bold">{t("allMarks")}</Link>
        </div>
        {marksItems.length === 0 ? (
          <p className="py-3 text-center text-sm text-ink-muted">{t("noMarksPublished")}</p>
        ) : (
          marksItems.slice(0, 4).map((m) => (
            <div key={m.id} className="row">
              <span>
                {m.subjectName} <span className="text-ink-muted">· {m.name}</span>
              </span>
              <b>{m.absent ? t("absent") : `${m.score ?? "–"} / ${m.maxMarks}`}</b>
            </div>
          ))
        )}
      </section>

      {/* Fees */}
      {nextDueFee && (
        <section className="card flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-ink-muted">
              {nextDueFee.state === "OVERDUE" ? t("overdueSince") : t("nextDue")} {nextDueFee.dueDate}
            </div>
            <div className={`text-xl font-extrabold ${nextDueFee.state === "OVERDUE" ? "text-danger" : "text-warn-800"}`}>{nextDueFee.amount}</div>
            <div className="text-xs text-ink-muted">{nextDueFee.title}</div>
          </div>
          <Link href="/parent/fees" className="btn shrink-0">
            {t("viewFees")}
          </Link>
        </section>
      )}

      {/* Proctor */}
      {proctor && (
        <section className="card flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-ink-muted">{t("proctorLabel")}</div>
            <div className="font-extrabold">{proctor.name}</div>
          </div>
          <Link href="/parent/messages#meeting" className="btn shrink-0">
            {t("requestMeeting")}
          </Link>
        </section>
      )}

      {/* Notices */}
      <section className="card">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-extrabold">{t("notices")}</h2>
          <Link href="/parent/messages#notices" className="text-[13px] font-bold">{t("allNotices")}</Link>
        </div>
        {notices.length === 0 ? (
          <p className="py-3 text-center text-sm text-ink-muted">{t("noNotices")}</p>
        ) : (
          notices.map((n) => (
            <div key={n.id} className="border-b border-line-soft py-2.5 last:border-b-0">
              <div className="text-sm font-bold">{n.title}</div>
              <div className="text-xs text-ink-muted">
                {n.authorName} · {n.createdAt}
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}
