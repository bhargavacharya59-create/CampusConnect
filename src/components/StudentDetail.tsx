// Read-only student profile for Dean, Director and Office screens.
import { prisma } from "@/lib/db";
import { ATTENDANCE_THRESHOLD } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/dates";
import { pct, rupees } from "@/lib/format";
import { getAttendance, getFees, getPublishedMarks, type StudentProfile } from "@/lib/queries/student";
import { Bar, Card, Empty, Kpi, KpiGrid } from "./ui";

export async function StudentDetail({ student }: { student: StudentProfile }) {
  const [att, marks, fees, notes] = await Promise.all([
    getAttendance(student.id),
    getPublishedMarks(student.classId, student.id),
    getFees(student.id),
    prisma.mentorNote.findMany({ where: { studentId: student.id }, orderBy: { createdAt: "desc" }, take: 10, include: { teacher: { include: { user: { select: { name: true } } } } } }),
  ]);
  return (
    <>
      <KpiGrid>
        <Kpi label="Attendance" value={pct(att.pct)} danger={att.pct < ATTENDANCE_THRESHOLD} />
        <Kpi label="Published marks" value={marks.pct != null ? pct(marks.pct) : "–"} />
        <Kpi label="Fee due" value={rupees(fees.dueTotal)} danger={fees.rows.some((r) => r.state === "OVERDUE")} />
        <Kpi label="Proctor" value={<span className="text-lg">{student.class.proctor?.user.name ?? "–"}</span>} />
      </KpiGrid>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Details">
          {(
            [
              ["Student ID", student.id],
              ["Class", `${student.class.name} · Semester ${student.class.semester}`],
              ["Department", student.class.department.name],
              ["Roll number", String(student.rollNo)],
              ["Email", student.user.email ?? "–"],
              ["Parent", `${student.parent.name} · ${student.parentId}`],
              ["Parent phone", student.parent.phone ?? "–"],
            ] as [string, string][]
          ).map(([k, v]) => (
            <div key={k} className="row">
              <span className="text-ink-muted">{k}</span>
              <span className="text-right font-semibold">{v}</span>
            </div>
          ))}
        </Card>
        <Card title="Attendance by subject">
          <div className="flex flex-col gap-3 py-1">
            {att.subjects.map((s) => (
              <Bar key={s.subjectId} label={s.name} value={s.pct} width={160} />
            ))}
          </div>
        </Card>
        <Card title="Marks">
          {marks.items.length === 0 ? (
            <Empty>No published marks.</Empty>
          ) : (
            marks.items.map((m) => (
              <div key={m.id} className="row">
                <span>
                  {m.subject.name} · {m.name}
                </span>
                <b>{m.absent ? "Absent" : `${m.score ?? "–"}/${m.maxMarks}`}</b>
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
              <span>
                <b>{rupees(f.amount)}</b>{" "}
                <span className={`pill ${f.state === "PAID" ? "pill-green" : f.state === "OVERDUE" ? "pill-red" : "pill-amber"}`}>{f.state === "PAID" ? "Paid" : f.state === "OVERDUE" ? "Overdue" : "Due"}</span>
              </span>
            </div>
          ))}
        </Card>
        <Card title="Proctor notes" className="lg:col-span-2">
          {notes.length === 0 ? (
            <Empty>No notes.</Empty>
          ) : (
            notes.map((n) => (
              <div key={n.id} className="border-b border-line-soft py-2 text-sm last:border-b-0">
                <div className="text-xs text-ink-muted">
                  {n.teacher.user.name} · {formatDateTime(n.createdAt)}
                </div>
                {n.note}
              </div>
            ))
          )}
        </Card>
      </div>
    </>
  );
}

/** Search box + results list linking to `${base}/${id}`. */
export async function StudentSearch({ q, base, departmentId }: { q: string; base: string; departmentId?: string }) {
  const term = q.trim();
  const results = term
    ? await prisma.student.findMany({
        where: {
          ...(departmentId ? { class: { departmentId } } : {}),
          OR: [{ id: { contains: term.toUpperCase() } }, { user: { name: { contains: term } } }, { parentId: { contains: term.toUpperCase() } }],
        },
        take: 30,
        orderBy: { id: "asc" },
        select: { id: true, classId: true, user: { select: { name: true } }, parent: { select: { name: true } } },
      })
    : [];
  return (
    <Card>
      <form action={base} className="flex flex-wrap gap-2">
        <label htmlFor="q" className="sr-only">
          Search students
        </label>
        <input id="q" name="q" defaultValue={term} placeholder="Name, student ID or parent ID" className="field max-w-md" />
        <button type="submit" className="btn">
          Search
        </button>
      </form>
      {term && (
        <div className="mt-3">
          {results.length === 0 ? (
            <Empty>No students found for “{term}”.</Empty>
          ) : (
            results.map((r) => (
              <a key={r.id} href={`${base}/${r.id}`} className="row hover:bg-ground">
                <span>
                  <b>{r.user.name}</b> <span className="font-mono text-xs text-ink-muted">{r.id}</span>
                  <span className="block text-xs text-ink-muted">Parent: {r.parent.name}</span>
                </span>
                <span className="pill pill-gray">{r.classId}</span>
              </a>
            ))
          )}
        </div>
      )}
    </Card>
  );
}
