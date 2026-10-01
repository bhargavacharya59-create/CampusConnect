import type { Metadata } from "next";
import { formatDate } from "@/lib/dates";
import { assessmentsWithStats } from "@/lib/queries/marks";
import { Card, Empty, PageHeader, StatusPill } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { getDept } from "../data";
import { decideMarks } from "../actions";

export const metadata: Metadata = { title: "Marks approval" };

export default async function DirectorMarks() {
  const { dept } = await getDept();
  const scope = { assignment: { class: { departmentId: dept.id } } };
  const [waiting, others] = await Promise.all([
    assessmentsWithStats({ ...scope, status: "SUBMITTED" }),
    assessmentsWithStats({ ...scope, status: { in: ["DIRECTOR_APPROVED", "PUBLISHED"] } }),
  ]);

  return (
    <>
      <PageHeader title="Marks approval" subtitle="Teacher → you → Dean → published. Check the numbers, then approve or send back with a note." />
      <Card title={`Waiting for you (${waiting.length})`}>
        {waiting.length === 0 ? (
          <Empty>No marks waiting for approval.</Empty>
        ) : (
          <ul className="flex flex-col divide-y divide-line-soft">
            {waiting.map((a) => (
              <li key={a.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-extrabold">
                      {a.name} · {a.subject} · {a.classId}
                    </div>
                    <div className="text-sm text-ink-muted">
                      {a.teacher} · {a.heldOn ? formatDate(a.heldOn) : ""} · out of {a.maxMarks}
                    </div>
                  </div>
                  <StatusPill status={a.status} />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
                  <Stat label="Entered" value={a.entered} />
                  <Stat label="Average" value={a.avg ?? "–"} />
                  <Stat label="Highest / lowest" value={`${a.high ?? "–"} / ${a.low ?? "–"}`} />
                  <Stat label="Pass rate" value={a.passPct != null ? `${a.passPct}%` : "–"} />
                  <Stat label="Absent" value={a.absent} />
                </div>
                <ActionForm action={decideMarks} className="mt-3 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="assessmentId" value={a.id} />
                  <div className="flex min-w-[220px] flex-1 flex-col gap-1">
                    <label htmlFor={`note-${a.id}`} className="text-xs font-bold">
                      Note to teacher (needed only when sending back)
                    </label>
                    <input id={`note-${a.id}`} name="note" className="field field-sm" placeholder="e.g. Please recheck roll 23 and 41" />
                  </div>
                  <SubmitButton name="decision" value="approve" className="btn btn-sm h-10" busy="Approving…">
                    Approve
                  </SubmitButton>
                  <SubmitButton name="decision" value="return" className="btn-outline btn-sm h-10" busy="Sending…">
                    Send back
                  </SubmitButton>
                </ActionForm>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Approved and published">
        {others.length === 0 ? (
          <Empty>Nothing yet.</Empty>
        ) : (
          <div className="-mx-4 overflow-x-auto">
            <table className="table min-w-[640px]">
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Class · Subject</th>
                  <th>Teacher</th>
                  <th>Average</th>
                  <th>Pass rate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {others.map((a) => (
                  <tr key={a.id}>
                    <td className="font-bold">{a.name}</td>
                    <td>
                      {a.classId} · {a.subject}
                    </td>
                    <td>{a.teacher}</td>
                    <td>
                      {a.avg ?? "–"} / {a.maxMarks}
                    </td>
                    <td>{a.passPct != null ? `${a.passPct}%` : "–"}</td>
                    <td>
                      <StatusPill status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-ground px-3 py-2">
      <div className="text-xs text-ink-muted">{label}</div>
      <div className="font-extrabold">{value}</div>
    </div>
  );
}
