import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ATTENDANCE_THRESHOLD } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/dates";
import { pct, rupees } from "@/lib/format";
import { getAttendance, getFees, getPublishedMarks } from "@/lib/queries/student";
import { Bar, Card, Empty, Kpi, KpiGrid, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { getMe } from "../../data";
import { addMentorNote, messageParent } from "../../actions";

export const metadata: Metadata = { title: "Student" };

export default async function ProctorStudent({ params }: { params: { studentId: string } }) {
  const { teacher } = await getMe();
  const student = await prisma.student.findFirst({
    where: { id: params.studentId, class: { proctorId: teacher.id } },
    include: { user: true, parent: true, class: true },
  });
  if (!student) notFound();

  const [att, marks, fees, notes, messages] = await Promise.all([
    getAttendance(student.id),
    getPublishedMarks(student.classId, student.id),
    getFees(student.id),
    prisma.mentorNote.findMany({ where: { studentId: student.id }, orderBy: { createdAt: "desc" }, include: { teacher: { include: { user: true } } } }),
    prisma.message.findMany({ where: { studentId: student.id }, orderBy: { createdAt: "desc" }, take: 10, include: { from: true } }),
  ]);

  return (
    <>
      <PageHeader
        title={student.user.name}
        subtitle={
          <>
            <span className="font-mono">{student.id}</span> · {student.class.name} · Roll {student.rollNo} ·{" "}
            <Link href="/teacher/proctor" className="link">
              Back to class
            </Link>
          </>
        }
      />
      <KpiGrid>
        <Kpi label="Attendance" value={pct(att.pct)} danger={att.pct < ATTENDANCE_THRESHOLD} hint={att.needed ? `needs ${att.needed} classes in a row` : `can miss ${att.canMiss}`} />
        <Kpi label="Published marks" value={marks.pct != null ? pct(marks.pct) : "–"} />
        <Kpi label="Fee due" value={rupees(fees.dueTotal)} danger={fees.rows.some((r) => r.state === "OVERDUE")} />
        <Kpi label="Absences" value={att.absences.length} />
      </KpiGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Attendance by subject">
          <div className="flex flex-col gap-3 py-1">
            {att.subjects.map((s) => (
              <Bar key={s.subjectId} label={s.name} value={s.pct} width={160} />
            ))}
          </div>
        </Card>
        <Card title="Marks">
          {marks.items.length === 0 ? (
            <Empty>No marks published yet.</Empty>
          ) : (
            marks.items.map((m) => (
              <div key={m.id} className="row">
                <span>
                  {m.subject.name} <span className="text-ink-muted">· {m.name}</span>
                </span>
                <span>
                  <b>{m.absent ? "Absent" : `${m.score ?? "–"}/${m.maxMarks}`}</b> <span className="text-xs text-ink-muted">avg {m.classAvg ?? "–"}</span>
                </span>
              </div>
            ))
          )}
        </Card>

        <Card title="Message the parent">
          <p className="mb-2 text-sm text-ink-muted">
            {student.parent.name} · <span className="font-mono">{student.parentId}</span>
            {student.parent.phone && (
              <>
                {" "}
                ·{" "}
                <a className="link" href={`tel:${student.parent.phone}`}>
                  {student.parent.phone}
                </a>
              </>
            )}
          </p>
          <ActionForm action={messageParent}>
            <input type="hidden" name="studentId" value={student.id} />
            <label htmlFor="body" className="label">
              Message
            </label>
            <textarea id="body" name="body" rows={3} required maxLength={1500} className="field h-auto py-2.5" />
            <div className="flex justify-end">
              <SubmitButton busy="Sending…">Send to parent</SubmitButton>
            </div>
          </ActionForm>
          {messages.length > 0 && (
            <div className="mt-4 border-t border-line-soft pt-2">
              <div className="mb-1 text-xs font-bold uppercase tracking-wide text-ink-muted">Recent messages</div>
              {messages.map((m) => (
                <div key={m.id} className="border-b border-line-soft py-2 text-sm last:border-b-0">
                  <div className="text-xs text-ink-muted">
                    {m.from.name} · {formatDateTime(m.createdAt)}
                  </div>
                  {m.body}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Mentoring notes (private)">
          <ActionForm action={addMentorNote}>
            <input type="hidden" name="studentId" value={student.id} />
            <label htmlFor="note" className="sr-only">
              New note
            </label>
            <textarea id="note" name="note" rows={2} required maxLength={1000} placeholder="e.g. Spoke to Sneha about attendance; she will attend extra lab." className="field h-auto py-2.5" />
            <div className="flex justify-end">
              <SubmitButton>Add note</SubmitButton>
            </div>
          </ActionForm>
          {notes.length === 0 ? (
            <Empty>No notes yet. Notes are visible to you, the Director and the Dean.</Empty>
          ) : (
            notes.map((n) => (
              <div key={n.id} className="border-b border-line-soft py-2.5 text-sm last:border-b-0">
                <div className="text-xs text-ink-muted">
                  {n.teacher.user.name} · {formatDateTime(n.createdAt)}
                </div>
                {n.note}
              </div>
            ))
          )}
        </Card>

        <Card title="Fees">
          {fees.rows.map((f) => (
            <div key={f.id} className="row">
              <span>
                {f.title}
                <span className="block text-xs text-ink-muted">due {formatDate(f.dueDate)}</span>
              </span>
              <span className="text-right">
                <b>{rupees(f.amount)}</b>{" "}
                <span className={`pill ${f.state === "PAID" ? "pill-green" : f.state === "OVERDUE" ? "pill-red" : "pill-amber"}`}>{f.state === "PAID" ? "Paid" : f.state === "OVERDUE" ? "Overdue" : "Due"}</span>
              </span>
            </div>
          ))}
        </Card>

        <Card title="Recent absences">
          {att.absences.length === 0 ? (
            <Empty>No absences.</Empty>
          ) : (
            att.absences.slice(0, 12).map((a, i) => (
              <div key={i} className="row">
                <span>{a.subject}</span>
                <span className="text-ink-muted">
                  {formatDate(a.date)} · P{a.period}
                </span>
              </div>
            ))
          )}
        </Card>
      </div>
    </>
  );
}
