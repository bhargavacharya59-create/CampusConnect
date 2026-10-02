"use client";

import { useI18n } from "@/lib/i18n/context";
import { PrintButton } from "@/components/PrintButton";

interface MarksData {
  pctFormatted: string;
  got: number;
  max: number;
  childName: string;
  childId: string;
  className: string;
  semester: number;
  departmentName: string;
  groups: {
    name: string;
    heldOn: string | null;
    items: {
      id: string;
      subjectName: string;
      absent: boolean;
      score: number | null;
      maxMarks: number;
      classAvg: number | null;
      pct: number | null;
    }[];
  }[];
}

export function MarksContent(props: MarksData) {
  const { t } = useI18n();
  const { pctFormatted, got, max, childName, childId, className, semester, departmentName, groups } = props;

  function gradeLabel(p: number): { label: string; cls: string } {
    if (p >= 85) return { label: t("excellent"), cls: "pill-green" };
    if (p >= 60) return { label: t("good"), cls: "pill-green" };
    if (p >= 40) return { label: t("needsWork"), cls: "pill-amber" };
    return { label: t("weak"), cls: "pill-red" };
  }

  return (
    <>
      <section className="card shadow-[0_10px_24px_rgba(11,61,58,0.10)]">
        <h1 className="sr-only">{t("marks")}</h1>
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-ink-muted">{t("overallPublishedTests")}</div>
            <div className="text-4xl font-extrabold">{pctFormatted}</div>
          </div>
          <div className="text-right text-sm text-ink-muted">
            {got} / {max} {t("marksCol").toLowerCase()}
          </div>
        </div>
        <div className="no-print mt-3 flex justify-end">
          <PrintButton label={t("printReportCard")} />
        </div>
      </section>

      {/* Only shown on paper */}
      <div className="hidden print:block">
        <h1 className="text-xl font-extrabold">{t("reportCard")} · {childName}</h1>
        <p className="text-sm">
          {childId} · {className} · {t("semester")} {semester} · {departmentName}
        </p>
      </div>

      {groups.length === 0 && (
        <section className="card">
          <p className="py-3 text-center text-sm text-ink-muted">{t("noMarksPublishedDesc")}</p>
        </section>
      )}

      {groups.map((group) => (
        <section key={group.name} className="card">
          <div className="mb-1 flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-extrabold">{group.name}</h2>
            {group.heldOn && <span className="text-xs text-ink-muted">{group.heldOn}</span>}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-ink-muted">
                <th className="py-1.5 font-bold">{t("subject")}</th>
                <th className="py-1.5 text-right font-bold">{t("marksCol")}</th>
                <th className="py-1.5 text-right font-bold">{t("classAvg")}</th>
              </tr>
            </thead>
            <tbody>
              {group.items.map((m) => {
                const g = m.pct != null ? gradeLabel(m.pct) : null;
                return (
                  <tr key={m.id} className="border-t border-line-soft">
                    <td className="py-2.5 pr-2">
                      <div className="font-semibold">{m.subjectName}</div>
                      {g && <span className={`pill mt-1 ${g.cls}`}>{g.label}</span>}
                      {m.absent && <span className="pill pill-red mt-1">{t("absent")}</span>}
                    </td>
                    <td className="py-2.5 text-right font-extrabold">{m.absent ? "–" : `${m.score ?? "–"} / ${m.maxMarks}`}</td>
                    <td className="py-2.5 text-right text-ink-muted">{m.classAvg ?? "–"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ))}
    </>
  );
}
