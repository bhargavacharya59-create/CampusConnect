import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { pct } from "@/lib/format";
import { getPublishedMarks } from "@/lib/queries/student";
import { Card, Empty, Kpi, KpiGrid, PageHeader } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";
import { getMe } from "../data";

export const metadata: Metadata = { title: "Marks" };

export default async function StudentMarks() {
  const { me } = await getMe();
  const [marks, homework] = await Promise.all([
    getPublishedMarks(me.classId, me.id),
    prisma.submission.findMany({
      where: { studentId: me.id, status: "APPROVED" },
      orderBy: { reviewedAt: "desc" },
      include: { coursework: { include: { assignment: { include: { subject: true } } } } },
    }),
  ]);
  const groups = new Map<string, typeof marks.items>();
  for (const m of marks.items) {
    if (!groups.has(m.name)) groups.set(m.name, []);
    groups.get(m.name)!.push(m);
  }

  return (
    <>
      <PageHeader title="Marks" subtitle="Only marks approved by the Director and published by the Dean appear here" actions={<PrintButton label="Print report card" />} />
      <div className="hidden print:block">
        <h2 className="text-xl font-extrabold">
          Report card · {me.user.name} · {me.id} · {me.class.name}
        </h2>
      </div>
      <KpiGrid>
        <Kpi label="Overall (published tests)" value={marks.pct != null ? pct(marks.pct) : "–"} />
        <Kpi label="Marks" value={`${marks.got}/${marks.max}`} />
        <Kpi label="Tests published" value={marks.items.length} />
        <Kpi label="Assignments marked" value={homework.length} />
      </KpiGrid>

      {groups.size === 0 && (
        <Card>
          <Empty>No marks published yet.</Empty>
        </Card>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {[...groups.entries()].map(([name, items]) => (
          <Card key={name} title={name} action={items[0].heldOn ? <span className="text-xs text-ink-muted">{formatDate(items[0].heldOn)}</span> : undefined}>
            <table className="table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th className="text-right">Marks</th>
                  <th className="text-right">Class avg</th>
                  <th className="text-right">Highest</th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m.id}>
                    <td className="font-semibold">{m.subject.name}</td>
                    <td className="text-right font-extrabold">{m.absent ? "Absent" : `${m.score ?? "–"} / ${m.maxMarks}`}</td>
                    <td className="text-right text-ink-muted">{m.classAvg ?? "–"}</td>
                    <td className="text-right text-ink-muted">{m.classHigh ?? "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}
        {homework.length > 0 && (
          <Card title="Assignments">
            <table className="table">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th className="text-right">Marks</th>
                </tr>
              </thead>
              <tbody>
                {homework.map((h) => (
                  <tr key={h.id}>
                    <td>
                      <div className="font-semibold">{h.coursework.title}</div>
                      <div className="text-xs text-ink-muted">{h.coursework.assignment.subject.name}</div>
                    </td>
                    <td className="text-right font-extrabold">
                      {h.finalScore ?? "–"} / {h.coursework.maxMarks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </>
  );
}
