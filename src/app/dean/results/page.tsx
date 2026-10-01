import type { Metadata } from "next";
import { formatDate } from "@/lib/dates";
import { assessmentsWithStats } from "@/lib/queries/marks";
import { requireRole } from "@/lib/auth";
import { Card, Empty, PageHeader } from "@/components/ui";
import { InlineAction } from "@/components/forms";
import { publishResults } from "../actions";

export const metadata: Metadata = { title: "Publish results" };

export default async function DeanResults() {
  await requireRole("DEAN");
  const [ready, published] = await Promise.all([
    assessmentsWithStats({ status: "DIRECTOR_APPROVED" }),
    assessmentsWithStats({ status: "PUBLISHED" }),
  ]);
  const depts = [...new Set<string>(ready.map((r) => r.departmentId))].sort();

  return (
    <>
      <PageHeader
        title="Publish results"
        subtitle="Results approved by Directors. Publishing makes them visible to students and parents."
        actions={ready.length > 0 && <InlineAction action={publishResults} fields={{}} label={`Publish all ${ready.length}`} busy="Publishing…" className="btn" confirm={`Publish all ${ready.length} results to students and parents?`} />}
      />
      {ready.length === 0 && (
        <Card>
          <Empty>No results waiting. Results appear here after a Director approves them.</Empty>
        </Card>
      )}
      {depts.map((d) => {
        const items = ready.filter((r) => r.departmentId === d);
        return (
          <Card key={d} title={`${d} · ${items.length} ready`} action={<InlineAction action={publishResults} fields={{ dept: d }} label={`Publish all ${d}`} busy="Publishing…" className="btn-outline btn-sm" />}>
            <div className="-mx-4 overflow-x-auto">
              <table className="table min-w-[720px]">
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Class · Subject</th>
                    <th>Teacher</th>
                    <th>Average</th>
                    <th>High / Low</th>
                    <th>Pass rate</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <b>{a.name}</b>
                        <span className="block text-xs text-ink-muted">{a.heldOn ? formatDate(a.heldOn) : ""}</span>
                      </td>
                      <td>
                        {a.classId} · {a.subject}
                      </td>
                      <td>{a.teacher}</td>
                      <td>
                        {a.avg ?? "–"} / {a.maxMarks}
                      </td>
                      <td>
                        {a.high ?? "–"} / {a.low ?? "–"}
                      </td>
                      <td>{a.passPct != null ? `${a.passPct}%` : "–"}</td>
                      <td>
                        <InlineAction action={publishResults} fields={{ assessmentId: String(a.id) }} label="Publish" busy="…" className="btn btn-sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}
      <Card title={`Published (${published.length})`}>
        <details>
          <summary className="cursor-pointer text-sm font-bold text-ink-muted">Show published results</summary>
          <div className="-mx-4 mt-2 overflow-x-auto">
            <table className="table min-w-[600px]">
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Class · Subject</th>
                  <th>Average</th>
                  <th>Pass rate</th>
                </tr>
              </thead>
              <tbody>
                {published.map((a) => (
                  <tr key={a.id}>
                    <td className="font-bold">{a.name}</td>
                    <td>
                      {a.classId} · {a.subject}
                    </td>
                    <td>
                      {a.avg ?? "–"} / {a.maxMarks}
                    </td>
                    <td>{a.passPct != null ? `${a.passPct}%` : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Card>
    </>
  );
}
