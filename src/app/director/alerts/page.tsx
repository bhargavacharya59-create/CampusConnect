import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatDateTime, istToday, weekStart } from "@/lib/dates";
import { pct } from "@/lib/format";
import { atRiskStudents } from "@/lib/risk";
import { isAiEnabled } from "@/lib/ai/gemini";
import { Card, Empty, PageHeader } from "@/components/ui";
import { InlineAction } from "@/components/forms";
import { getDept } from "../data";
import { runRiskAlerts } from "../actions";

export const metadata: Metadata = { title: "At-risk alerts" };

const RISK = { HIGH: "pill-red", MEDIUM: "pill-amber", LOW: "pill-gray" } as const;

export default async function DirectorAlerts() {
  const { dept } = await getDept();
  const candidates = (await atRiskStudents(dept.id)).slice(0, 40);
  const ai = await prisma.aiSummary.findMany({
    where: { kind: "RISK_ALERT", periodStart: weekStart(istToday()), studentId: { in: candidates.map((c) => c.studentId) } },
  });
  type AiRisk = { risk: keyof typeof RISK; reason: string; action: string };
  const aiBy = new Map<string, AiRisk | null>();
  for (const a of ai) {
    try {
      aiBy.set(a.studentId, JSON.parse(a.text) as AiRisk);
    } catch {
      aiBy.set(a.studentId, null);
    }
  }
  const enabled = isAiEnabled("ALERTS");
  const lastRun = ai.length ? ai.reduce((m, a) => (a.createdAt > m ? a.createdAt : m), ai[0].createdAt) : null;

  return (
    <>
      <PageHeader
        title="At-risk alerts"
        subtitle="Students flagged by attendance trends, low marks or missed tests. AI explains each case and suggests an action."
        actions={enabled ? <InlineAction action={runRiskAlerts} fields={{}} label={ai.length ? "Refresh AI review" : "Review with AI"} busy="AI is reviewing…" className="btn" /> : undefined}
      />
      {!enabled && <p className="rounded-xl bg-warn-50 px-4 py-3 text-sm text-warn-900">AI explanations are off. Add GEMINI_KEY_ALERTS to the .env file. The rule-based list below still works.</p>}
      {lastRun && <p className="text-sm text-ink-muted">AI review this week: {formatDateTime(lastRun)}</p>}
      <Card title={`${candidates.length} students flagged`}>
        {candidates.length === 0 ? (
          <Empty>No students at risk right now.</Empty>
        ) : (
          <ul className="flex flex-col divide-y divide-line-soft">
            {candidates.map((c) => {
              const a = aiBy.get(c.studentId);
              return (
                <li key={c.studentId} className="py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="font-extrabold">{c.name}</span> <span className="font-mono text-xs text-ink-muted">{c.studentId}</span> · {c.classId}
                      <div className="text-sm text-ink-muted">
                        Attendance {pct(c.overall)} (last 2 weeks {pct(c.recent)}) · marks {c.marksPct != null ? pct(c.marksPct) : "–"}
                      </div>
                    </div>
                    {a ? <span className={`pill ${RISK[a.risk] ?? "pill-amber"}`}>{a.risk} risk</span> : <span className="pill pill-gray">Score {c.score}</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {c.reasons.map((r) => (
                      <span key={r} className="pill pill-gray font-semibold">
                        {r}
                      </span>
                    ))}
                  </div>
                  {a && (
                    <div className="mt-2 rounded-xl border border-[#C7D7FE] bg-[#F0F4FF] p-3 text-sm">
                      <p>{a.reason}</p>
                      <p className="mt-1">
                        <b>Suggested action:</b> {a.action}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
