// Small presentational pieces shared by the parent pages.
import { ATTENDANCE_THRESHOLD } from "@/lib/constants";
import { pct } from "@/lib/format";
import type { PeriodStatus } from "@/lib/queries/student";

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-1 flex items-center justify-between gap-3">
      <h2 className="text-[15px] font-extrabold">{children}</h2>
      {action}
    </div>
  );
}

export function AttendanceBar({ label, value, sub }: { label: string; value: number; sub?: string }) {
  const low = value < ATTENDANCE_THRESHOLD;
  return (
    <div className="flex flex-col gap-1.5 py-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold">{label}</span>
        <span className={`font-extrabold ${low ? "text-danger" : ""}`}>{pct(value)}</span>
      </div>
      <div
        className="relative h-2.5 rounded-full bg-[#EEF0F3]"
        role="meter"
        aria-label={`${label} attendance`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <div className={`h-2.5 rounded-full ${low ? "bg-danger" : "bg-brand-600"}`} style={{ width: `${Math.min(100, value)}%` }} />
        {/* 75% marker */}
        <div className="absolute top-[-3px] h-4 w-0.5 rounded bg-ink/40" style={{ left: `${ATTENDANCE_THRESHOLD}%` }} />
      </div>
      {sub && <div className="text-xs text-ink-muted">{sub}</div>}
    </div>
  );
}

const STATUS: Record<PeriodStatus, { label: string; cls: string }> = {
  PRESENT: { label: "Present", cls: "pill-green" },
  ABSENT: { label: "Absent", cls: "pill-red" },
  NOT_MARKED: { label: "Not marked yet", cls: "pill-amber" },
  UPCOMING: { label: "Later", cls: "pill-gray" },
};

export function PeriodPill({ status }: { status: PeriodStatus }) {
  const s = STATUS[status];
  return <span className={`pill ${s.cls}`}>{s.label}</span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-3 text-center text-sm text-ink-muted">{children}</p>;
}
