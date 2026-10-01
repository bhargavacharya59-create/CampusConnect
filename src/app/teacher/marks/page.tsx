import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, isoDate, istToday } from "@/lib/dates";
import { Card, Empty, PageHeader, StatusPill } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { getMe } from "../data";
import { createAssessment } from "../actions";

export const metadata: Metadata = { title: "Marks entry" };

export default async function MarksList() {
  const { teacher } = await getMe();
  const tests = await prisma.assessment.findMany({
    where: { assignment: { teacherId: teacher.id } },
    orderBy: [{ heldOn: "desc" }, { id: "desc" }],
    include: { assignment: { include: { subject: true } }, _count: { select: { marks: true } } },
  });

  return (
    <>
      <PageHeader title="Marks entry" subtitle="Enter marks, then submit. Marks go Teacher → Director → Dean → published to students and parents." />
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card title="Your tests">
          {tests.length === 0 ? (
            <Empty>No tests yet.</Empty>
          ) : (
            <div className="-mx-4 overflow-x-auto">
              <table className="table min-w-[560px]">
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Class · Subject</th>
                    <th>Date</th>
                    <th>Entered</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((t) => (
                    <tr key={t.id}>
                      <td className="font-bold">{t.name}</td>
                      <td>
                        {t.assignment.classId} · {t.assignment.subject.name}
                      </td>
                      <td>{t.heldOn ? formatDate(t.heldOn) : "–"}</td>
                      <td>{t._count.marks}</td>
                      <td>
                        <StatusPill status={t.status} />
                        {t.reviewNote && t.status === "DRAFT" && <span className="pill pill-red ml-1">Sent back</span>}
                      </td>
                      <td>
                        <Link href={`/teacher/marks/${t.id}`} className={t.status === "DRAFT" ? "btn btn-sm" : "btn-outline btn-sm"}>
                          {t.status === "DRAFT" ? "Enter" : "View"}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="New test">
          <ActionForm action={createAssessment}>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="assignmentId" className="label">
                Class and subject
              </label>
              <select id="assignmentId" name="assignmentId" required className="field">
                {teacher.assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.classId} · {a.subject.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="label">
                Test name
              </label>
              <input id="name" name="name" required placeholder="IA-2" className="field" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="maxMarks" className="label">
                  Max marks
                </label>
                <input id="maxMarks" name="maxMarks" type="number" min={1} max={200} defaultValue={50} required className="field" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="heldOn" className="label">
                  Date
                </label>
                <input id="heldOn" name="heldOn" type="date" defaultValue={isoDate(istToday())} required className="field" />
              </div>
            </div>
            <SubmitButton busy="Creating…">Create and enter marks</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
