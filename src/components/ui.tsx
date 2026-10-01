// Shared presentational components for the staff and student screens.
import Link from "next/link";
import { ATTENDANCE_THRESHOLD, RED_THEME_AT } from "@/lib/constants";
import { pct } from "@/lib/format";
import type { PendingTask } from "@/lib/pending";
import { AlertIcon, CheckIcon } from "./icons";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-[26px]">{title}</h1>
        {subtitle && <div className="mt-1 text-sm text-ink-muted">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </header>
  );
}

export function Kpi({ label, value, danger, hint }: { label: string; value: React.ReactNode; danger?: boolean; hint?: string }) {
  return (
    <div className="card">
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value ${danger ? "text-danger" : ""}`}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-ink-muted">{hint}</div>}
    </div>
  );
}

export function KpiGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{children}</div>;
}

export function Card({ title, action, children, className = "" }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="text-[17px] font-extrabold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-4 text-center text-sm text-ink-muted">{children}</p>;
}

/**
 * Banner at the top of Director/Teacher/Student home pages.
 * Red at RED_THEME_AT or more tasks, a calm list for 1-2, green when clear.
 */
export function PendingBanner({ tasks, doneText = "Nothing is pending. Nice work." }: { tasks: PendingTask[]; doneText?: string }) {
  if (tasks.length === 0) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-brand-100 bg-brand-50 px-5 py-4 text-brand-900">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
          <CheckIcon />
        </span>
        <div>
          <div className="text-[17px] font-extrabold">All caught up</div>
          <div className="text-sm">{doneText}</div>
        </div>
      </div>
    );
  }
  const red = tasks.length >= RED_THEME_AT;
  return (
    <div className={`rounded-2xl px-5 py-4 ${red ? "bg-alert-600 text-white" : "border border-warn-50 bg-warn-50 text-warn-900"}`}>
      <div className="flex items-center gap-4">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${red ? "bg-alert-700" : "bg-white text-warn-800"}`}>
          <AlertIcon />
        </span>
        <div>
          <div className="text-[17px] font-extrabold">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"} pending
          </div>
          <div className={`text-sm ${red ? "text-alert-100" : ""}`}>{red ? "Clear these to bring the screen back to the light theme." : "Almost there."}</div>
        </div>
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {tasks.map((t, i) => (
          <li key={i}>
            <Link
              href={t.href}
              className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold ${red ? "bg-white/10 hover:bg-white/20" : "bg-white hover:bg-white/70"}`}
            >
              <span className="min-w-0">
                {t.label}
                {t.detail && <span className={`block text-xs font-normal ${red ? "text-alert-100" : "text-ink-muted"}`}>{t.detail}</span>}
              </span>
              {t.overdue && <span className={`pill ${red ? "bg-white text-alert-800" : "pill-red"}`}>Overdue</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Bar({ label, value, sub, width = 140 }: { label: string; value: number; sub?: string; width?: number }) {
  const low = value < ATTENDANCE_THRESHOLD;
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="shrink-0 truncate" style={{ width }} title={label}>
        {label}
      </div>
      <div className="relative h-2.5 flex-1 rounded-full bg-[#EEF0F3]" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
        <div className={`h-2.5 rounded-full ${low ? "bg-danger" : "bg-[color:var(--accent)]"}`} style={{ width: `${Math.min(100, value)}%` }} />
        <div className="absolute top-[-3px] h-4 w-0.5 rounded bg-ink/30" style={{ left: `${ATTENDANCE_THRESHOLD}%` }} />
      </div>
      <b className={`w-14 shrink-0 text-right ${low ? "text-danger" : ""}`}>{pct(value)}</b>
      {sub && <span className="hidden w-20 shrink-0 text-right text-xs text-ink-muted sm:inline">{sub}</span>}
    </div>
  );
}

export function Feedback({ state }: { state: { error?: string; ok?: string } }) {
  if (state.error)
    return (
      <p role="alert" className="rounded-xl bg-alert-100 px-3 py-2 text-sm font-semibold text-alert-800">
        {state.error}
      </p>
    );
  if (state.ok)
    return (
      <p role="status" className="rounded-xl bg-ok-50 px-3 py-2 text-sm font-semibold text-ok-900">
        {state.ok}
      </p>
    );
  return null;
}

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Pending", cls: "pill-amber" },
  APPROVED: { label: "Approved", cls: "pill-green" },
  REJECTED: { label: "Rejected", cls: "pill-red" },
  DRAFT: { label: "Draft", cls: "pill-gray" },
  SUBMITTED: { label: "With Director", cls: "pill-amber" },
  DIRECTOR_APPROVED: { label: "With Dean", cls: "pill-blue" },
  PUBLISHED: { label: "Published", cls: "pill-green" },
  ACCEPTED: { label: "Accepted", cls: "pill-green" },
  DECLINED: { label: "Declined", cls: "pill-red" },
};
export function StatusPill({ status }: { status: string }) {
  const s = STATUS_PILL[status] ?? { label: status, cls: "pill-gray" };
  return <span className={`pill ${s.cls}`}>{s.label}</span>;
}
