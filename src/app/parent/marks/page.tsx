import type { Metadata } from "next";
import { formatDate } from "@/lib/dates";
import { pct } from "@/lib/format";
import { getPublishedMarks } from "@/lib/queries/student";
import { PrintButton } from "@/components/PrintButton";
import { getParentAndChild } from "../data";
import { Empty, SectionTitle } from "../ui";

export const metadata: Metadata = { title: "Marks" };

function grade(p: number): { label: string; cls: string } {
  if (p >= 85) return { label: "Excellent", cls: "pill-green" };
  if (p >= 60) return { label: "Good", cls: "pill-green" };
  if (p >= 40) return { label: "Needs work", cls: "pill-amber" };
  return { label: "Weak", cls: "pill-red" };
}

export default async function MarksPage() {
  const { child } = await getParentAndChild();
  if (!child) return null;
  const marks = await getPublishedMarks(child.classId, child.id);

  // Group by assessment name (IA-1, Lab Internal, ...)
  const groups = new Map<string, typeof marks.items>();
  for (const m of marks.items) {
    if (!groups.has(m.name)) groups.set(m.name, []);
    groups.get(m.name)!.push(m);
  }

  return (
    <>
      <section className="card shadow-[0_10px_24px_rgba(11,61,58,0.10)]">
        <h1 className="sr-only">Marks</h1>
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-ink-muted">Overall (published tests)</div>
            <div className="text-4xl font-extrabold">{marks.pct != null ? pct(marks.pct) : "–"}</div>
          </div>
          <div className="text-right text-sm text-ink-muted">
            {marks.got} / {marks.max} marks
          </div>
        </div>
        <div className="no-print mt-3 flex justify-end">
          <PrintButton label="Print report card" />
        </div>
      </section>

      {/* Only shown on paper */}
      <div className="hidden print:block">
        <h1 className="text-xl font-extrabold">Report card · {child.user.name}</h1>
        <p className="text-sm">
          {child.id} · {child.class.name} · Semester {child.class.semester} · {child.class.department.name}
        </p>
      </div>

      {groups.size === 0 && (
        <section className="card">
          <Empty>No marks have been published yet. Marks appear here after the Dean publishes them.</Empty>
        </section>
      )}

      {[...groups.entries()].map(([name, items]) => (
        <section key={name} className="card">
          <SectionTitle action={items[0].heldOn ? <span className="text-xs text-ink-muted">{formatDate(items[0].heldOn)}</span> : undefined}>{name}</SectionTitle>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-ink-muted">
                <th className="py-1.5 font-bold">Subject</th>
                <th className="py-1.5 text-right font-bold">Marks</th>
                <th className="py-1.5 text-right font-bold">Class avg</th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => {
                const p = m.score != null ? (m.score / m.maxMarks) * 100 : null;
                const g = p != null ? grade(p) : null;
                return (
                  <tr key={m.id} className="border-t border-line-soft">
                    <td className="py-2.5 pr-2">
                      <div className="font-semibold">{m.subject.name}</div>
                      {g && <span className={`pill mt-1 ${g.cls}`}>{g.label}</span>}
                      {m.absent && <span className="pill pill-red mt-1">Absent</span>}
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
