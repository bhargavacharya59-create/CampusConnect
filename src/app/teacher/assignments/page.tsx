import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { addDays, formatDate, isoDate, istToday } from "@/lib/dates";
import { assignmentAiEnabled } from "@/lib/ai/assignment";
import { Card, Empty, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { getMe } from "../data";
import { createCoursework } from "../actions";

export const metadata: Metadata = { title: "Assignments" };

export default async function AssignmentsList() {
  const { teacher } = await getMe();
  const items = await prisma.coursework.findMany({
    where: { assignment: { teacherId: teacher.id } },
    orderBy: { dueDate: "desc" },
    include: {
      assignment: { include: { subject: true, class: { include: { _count: { select: { students: true } } } } } },
      submissions: { select: { status: true } },
    },
  });
  const today = istToday();

  return (
    <>
      <PageHeader
        title="Assignments"
        subtitle={assignmentAiEnabled() ? "Students upload their work; AI suggests marks and feedback; you approve before students see marks." : "AI checking is off (add GEMINI_KEY_ASSIGNMENT). You can still mark submissions yourself."}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card title="Your assignments">
          {items.length === 0 ? (
            <Empty>No assignments yet.</Empty>
          ) : (
            <div className="-mx-4 overflow-x-auto">
              <table className="table min-w-[620px]">
                <thead>
                  <tr>
                    <th>Assignment</th>
                    <th>Class · Subject</th>
                    <th>Due</th>
                    <th>Submitted</th>
                    <th>To review</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => {
                    const review = c.submissions.filter((s) => ["SUBMITTED", "AI_CHECKED", "AI_FAILED"].includes(s.status)).length;
                    return (
                      <tr key={c.id}>
                        <td className="font-bold">{c.title}</td>
                        <td>
                          {c.assignment.classId} · {c.assignment.subject.name}
                        </td>
                        <td>
                          {formatDate(c.dueDate)} {c.dueDate < today ? <span className="pill pill-gray">Closed</span> : <span className="pill pill-green">Open</span>}
                        </td>
                        <td>
                          {c.submissions.length}/{c.assignment.class._count.students}
                        </td>
                        <td>{review ? <span className="pill pill-red">{review}</span> : "–"}</td>
                        <td>
                          <Link href={`/teacher/assignments/${c.id}`} className={review ? "btn btn-sm" : "btn-outline btn-sm"}>
                            Open
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="New assignment">
          <ActionForm action={createCoursework}>
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
              <label htmlFor="title" className="label">
                Title
              </label>
              <input id="title" name="title" required placeholder="Assignment 3" className="field" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="instructions" className="label">
                Question / instructions (students see this)
              </label>
              <textarea id="instructions" name="instructions" rows={4} required className="field h-auto py-2.5" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="answerKey" className="label">
                Answer key for AI checking (hidden from students)
              </label>
              <textarea id="answerKey" name="answerKey" rows={3} placeholder="Key points and marks for each" className="field h-auto py-2.5" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="maxMarks" className="label">
                  Max marks
                </label>
                <input id="maxMarks" name="maxMarks" type="number" min={1} max={100} defaultValue={10} required className="field" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="dueDate" className="label">
                  Due date
                </label>
                <input id="dueDate" name="dueDate" type="date" min={isoDate(today)} defaultValue={isoDate(addDays(today, 7))} required className="field" />
              </div>
            </div>
            <SubmitButton busy="Creating…">Create assignment</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
