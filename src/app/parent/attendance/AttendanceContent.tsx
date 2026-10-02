"use client";

import { useI18n } from "@/lib/i18n/context";

interface AttendanceData {
  pct: number;
  pctFormatted: string;
  present: number;
  total: number;
  needed: number;
  canMiss: number;
  threshold: number;
  low: boolean;
  firstName: string;
  subjects: { subjectId: string; name: string; pct: number; present: number; total: number }[];
  absences: { dateTime: number; dateFormatted: string; items: { period: number; subject: string; periodStart: string }[] }[];
}

export function AttendanceContent(props: AttendanceData) {
  const { t } = useI18n();
  const { pctFormatted, present, total, needed, canMiss, threshold, low, firstName, subjects, absences } = props;

  return (
    <>
      <section className="card shadow-[0_10px_24px_rgba(11,61,58,0.10)]">
        <h1 className="sr-only">{t("attendance")}</h1>
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-ink-muted">{t("overallAttendance")}</div>
            <div className={`text-4xl font-extrabold ${low ? "text-danger" : ""}`}>{pctFormatted}</div>
          </div>
          <div className="text-right text-sm text-ink-muted">
            {t("classesOf", { present, total })}
            <br />
            {t("minimumThreshold", { threshold })}
          </div>
        </div>
        <p className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${low ? "bg-alert-100 text-alert-800" : "bg-ok-50 text-ok-900"}`}>
          {low
            ? t("mustAttendToReach", { name: firstName, count: `${needed} ${needed === 1 ? t("classWord") : t("classesWord")}`, threshold })
            : canMiss > 0
              ? t("aboveThresholdCanMiss", { name: firstName, count: `${canMiss} ${canMiss === 1 ? t("classWord") : t("classesWord")}`, threshold })
              : t("exactlyAtLimit", { name: firstName, threshold })}
        </p>
      </section>

      <section className="card">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-extrabold">{t("subjectWise")}</h2>
        </div>
        {subjects.length === 0 ? (
          <p className="py-3 text-center text-sm text-ink-muted">{t("noAttendanceRecorded")}</p>
        ) : (
          subjects.map((s) => {
            const sLow = s.pct < threshold;
            return (
              <div key={s.subjectId} className="flex flex-col gap-1.5 py-1.5">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-semibold">{s.name}</span>
                  <span className={`font-extrabold ${sLow ? "text-danger" : ""}`}>{s.pct}%</span>
                </div>
                <div
                  className="relative h-2.5 rounded-full bg-[#EEF0F3]"
                  role="meter"
                  aria-label={`${s.name} ${t("attendance")}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={s.pct}
                >
                  <div className={`h-2.5 rounded-full ${sLow ? "bg-danger" : "bg-brand-600"}`} style={{ width: `${Math.min(100, s.pct)}%` }} />
                  <div className="absolute top-[-3px] h-4 w-0.5 rounded bg-ink/40" style={{ left: `${threshold}%` }} />
                </div>
                <div className="text-xs text-ink-muted">{t("classesOf", { present: s.present, total: s.total })}</div>
              </div>
            );
          })
        )}
        <p className="mt-2 text-xs text-ink-muted">{t("barMarks", { threshold })}</p>
      </section>

      <section className="card">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-extrabold">{t("recentAbsences")}</h2>
        </div>
        {absences.length === 0 ? (
          <p className="py-3 text-center text-sm text-ink-muted">{t("noAbsencesGreat")}</p>
        ) : (
          absences.map((d) => (
            <div key={d.dateTime} className="border-b border-line-soft py-2.5 last:border-b-0">
              <div className="text-sm font-extrabold">{d.dateFormatted}</div>
              <ul className="mt-1 flex flex-col gap-0.5">
                {d.items
                  .sort((a, b) => a.period - b.period)
                  .map((i) => (
                    <li key={i.period} className="flex justify-between text-sm">
                      <span>{i.subject}</span>
                      <span className="text-ink-muted">
                        P{i.period} · {i.periodStart}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </>
  );
}
