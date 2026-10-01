import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ATTENDANCE_THRESHOLD } from "@/lib/constants";
import { pct } from "@/lib/format";
import { classAttendance } from "@/lib/queries/staff";
import { isAiEnabled } from "@/lib/ai/gemini";
import { Bar, Card, Kpi, KpiGrid, PageHeader } from "@/components/ui";
import { AiForm, SubmitButton } from "@/components/forms";
import { getMe } from "../data";
import { proctorClassSummary } from "../ai-actions";

export const metadata: Metadata = { title: "My proctor class" };

export default async function ProctorPage({ searchParams }: { searchParams: { q?: string; show?: string } }) {
  const { teacher } = await getMe();
  if (!teacher.proctorOf) redirect("/teacher");
  const cls = teacher.proctorOf;
  const data = await classAttendance(cls.id);

  const q = (searchParams.q ?? "").trim().toLowerCase();
  const lowOnly = searchParams.show === "low";
  const lowIds = new Set(data.low.map((s) => s.id));
  let rows = data.rows.filter((r) => !q || r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q));
  if (lowOnly) rows = rows.filter((r) => lowIds.has(r.id));
  rows = [...rows].sort((a, b) => Number(lowIds.has(b.id)) - Number(lowIds.has(a.id)) || a.rollNo - b.rollNo);

  return (
    <>
      <PageHeader title={`My proctor class · ${cls.name}`} subtitle={`${data.rows.length} students · Semester ${cls.semester} · all subjects`} />
      <KpiGrid>
        <Kpi label="Class attendance" value={pct(data.overall)} danger={data.overall < ATTENDANCE_THRESHOLD} />
        <Kpi label="Students below 75%" value={data.low.length} danger={data.low.length > 0} hint="overall or in any subject" />
        <Kpi label="Lowest subject" value={data.subjects.length ? [...data.subjects].sort((a, b) => a.pct - b.pct)[0].shortName : "–"} />
        <Kpi label="Students" value={data.rows.length} />
      </KpiGrid>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <Card title="Attendance by subject">
          <div className="flex flex-col gap-3 py-1">
            {data.subjects.map((s) => (
              <Bar key={s.subjectId} label={`${s.name}`} value={s.pct} width={160} />
            ))}
          </div>
        </Card>
        <Card title="AI class summary">
          {isAiEnabled("TEACHER") ? (
            <AiForm action={proctorClassSummary}>
              <p className="text-sm text-ink-muted">Get a short summary of the class: who needs attention, which subjects are weak, and what to do this week.</p>
              <SubmitButton busy="Thinking…" className="btn-outline">
                Write summary with AI
              </SubmitButton>
            </AiForm>
          ) : (
            <p className="text-sm text-ink-muted">Switch on AI by adding GEMINI_KEY_TEACHER.</p>
          )}
        </Card>
      </div>

      <Card
        title="Students"
        action={
          <form className="flex flex-wrap items-center gap-2" action="/teacher/proctor">
            <label htmlFor="q" className="sr-only">
              Search
            </label>
            <input id="q" name="q" defaultValue={searchParams.q} placeholder="Name or ID" className="field field-sm w-44" />
            <label className="flex items-center gap-1.5 text-sm font-semibold">
              <input type="checkbox" name="show" value="low" defaultChecked={lowOnly} /> Below 75% only
            </label>
            <button className="btn-outline btn-sm" type="submit">
              Filter
            </button>
          </form>
        }
      >
        <div className="-mx-4 overflow-x-auto">
          <table className="table min-w-[760px]">
            <thead>
              <tr>
                <th>Roll</th>
                <th>Student</th>
                {data.subjects.map((s) => (
                  <th key={s.subjectId} title={s.name}>
                    {s.shortName}
                  </th>
                ))}
                <th>Overall</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.rollNo}</td>
                  <td>
                    <div className="font-bold">{r.name}</div>
                    <div className="font-mono text-xs text-ink-muted">{r.id}</div>
                  </td>
                  {data.subjects.map((s) => {
                    const v = r.bySubject[s.subjectId];
                    return (
                      <td key={s.subjectId} className={v != null && v < ATTENDANCE_THRESHOLD ? "font-bold text-danger" : ""}>
                        {v != null ? pct(v) : "–"}
                      </td>
                    );
                  })}
                  <td className={r.overall < ATTENDANCE_THRESHOLD ? "font-extrabold text-danger" : "font-bold"}>{pct(r.overall)}</td>
                  <td>
                    <Link href={`/teacher/proctor/${r.id}`} className={lowIds.has(r.id) ? "btn btn-sm" : "btn-outline btn-sm"}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
