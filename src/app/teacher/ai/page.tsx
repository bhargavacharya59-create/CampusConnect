import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { isAiEnabled } from "@/lib/ai/gemini";
import { aiQuotaLeft } from "@/lib/ai/limits";
import { Card, PageHeader } from "@/components/ui";
import { ActionForm, AiForm, SubmitButton } from "@/components/forms";
import { getMe } from "../data";
import { draftParentMessage, generateQuestions } from "../ai-actions";
import { messageParent } from "../actions";

export const metadata: Metadata = { title: "AI helper" };

export default async function AiHelper() {
  const { session, teacher } = await getMe();
  const enabled = isAiEnabled("TEACHER");
  const left = enabled ? await aiQuotaLeft(session.userId, "TEACHER") : 0;
  const classIds = [...new Set([teacher.proctorOf?.id, ...teacher.assignments.map((a) => a.classId)].filter(Boolean) as string[])];
  const students = await prisma.student.findMany({ where: { classId: { in: classIds } }, orderBy: [{ classId: "asc" }, { rollNo: "asc" }], select: { id: true, classId: true, user: { select: { name: true } } } });
  const subjects = [...new Map(teacher.assignments.map((a) => [a.subjectId, a.subject.name])).values()];

  return (
    <>
      <PageHeader title="AI helper" subtitle={enabled ? `Powered by Gemini · ${left} AI requests left today · always check AI drafts before using them` : "AI is not switched on yet: add GEMINI_KEY_TEACHER to the .env file"} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Draft a message to a parent">
          <AiForm action={draftParentMessage}>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="studentId" className="label">
                Student
              </label>
              <select id="studentId" name="studentId" required className="field" defaultValue="">
                <option value="" disabled>
                  Choose a student
                </option>
                {classIds.map((c) => (
                  <optgroup key={c} label={c}>
                    {students
                      .filter((s) => s.classId === c)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.user.name} · {s.id}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="purpose" className="label">
                What is the message about?
              </label>
              <textarea id="purpose" name="purpose" rows={2} required placeholder="e.g. attendance dropped in DBMS; ask parent to make sure she attends" className="field h-auto py-2.5" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="language" className="label">
                Language
              </label>
              <select id="language" name="language" className="field">
                <option>English</option>
                <option>Kannada</option>
                <option>Hindi</option>
              </select>
            </div>
            <SubmitButton busy="Writing…" className="btn" >
              Write draft
            </SubmitButton>
          </AiForm>
        </Card>

        <Card title="Generate questions">
          <AiForm action={generateQuestions}>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="subject" className="label">
                Subject
              </label>
              <select id="subject" name="subject" className="field">
                {subjects.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="topic" className="label">
                Topic
              </label>
              <input id="topic" name="topic" required placeholder="e.g. Binary search trees" className="field" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="count" className="label">
                  How many
                </label>
                <input id="count" name="count" type="number" min={1} max={15} defaultValue={5} className="field" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="kind" className="label">
                  Type
                </label>
                <select id="kind" name="kind" className="field">
                  <option>Short answer</option>
                  <option>Long answer</option>
                  <option>Multiple choice</option>
                  <option>Problems / numericals</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="level" className="label">
                  Level
                </label>
                <select id="level" name="level" className="field">
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
            </div>
            <SubmitButton busy="Writing…">Generate</SubmitButton>
          </AiForm>
        </Card>

        <Card title="Send a message to a parent" className="lg:col-span-2">
          <p className="mb-2 text-sm text-ink-muted">Paste or edit the AI draft here, then send. The parent sees it in their Messages tab.</p>
          <ActionForm action={messageParent}>
            <div className="grid gap-3 sm:grid-cols-[280px_1fr]">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="sendStudent" className="label">
                  Student
                </label>
                <select id="sendStudent" name="studentId" required className="field" defaultValue="">
                  <option value="" disabled>
                    Choose a student
                  </option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.classId} · {s.user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="sendBody" className="label">
                  Message
                </label>
                <textarea id="sendBody" name="body" rows={4} required maxLength={1500} className="field h-auto py-2.5" />
              </div>
            </div>
            <div className="flex justify-end">
              <SubmitButton busy="Sending…">Send to parent</SubmitButton>
            </div>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
