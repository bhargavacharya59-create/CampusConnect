import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { DAYS, PERIODS, PERIODS_PER_DAY, WORKING_DAYS } from "@/lib/constants";
import { Card, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { saveTimetable } from "../actions";

export const metadata: Metadata = { title: "Timetable" };

export default async function AdminTimetable({ searchParams }: { searchParams: { class?: string } }) {
  await requireRole("ADMIN");
  const classes = await prisma.class.findMany({ orderBy: { id: "asc" }, select: { id: true } });
  const selectedId = classes.find((c) => c.id === searchParams.class)?.id ?? classes[0]?.id;
  const cls = selectedId
    ? await prisma.class.findUnique({
        where: { id: selectedId },
        include: { assignments: { include: { subject: true, teacher: { include: { user: { select: { name: true } } } } }, orderBy: { subjectId: "asc" } }, slots: true },
      })
    : null;
  const days = Array.from({ length: WORKING_DAYS }, (_, i) => i + 1);
  const periods = Array.from({ length: PERIODS_PER_DAY }, (_, i) => i + 1);

  return (
    <>
      <PageHeader title="Timetable" subtitle="Choose the subject for each period and save. Saving is refused if a teacher would be in two classes at once." />
      <div className="flex flex-wrap gap-2">
        {classes.map((c) => (
          <Link key={c.id} href={`/admin/timetable?class=${c.id}`} className={c.id === selectedId ? "btn btn-sm" : "btn-outline btn-sm"}>
            {c.id}
          </Link>
        ))}
      </div>
      {cls && (
        <Card title={`Timetable · ${cls.id}`}>
          <ActionForm action={saveTimetable} resetOnSuccess={false}>
            <input type="hidden" name="classId" value={cls.id} />
            <div className="-mx-4 overflow-x-auto">
              <table className="table min-w-[820px] table-fixed">
                <thead>
                  <tr>
                    <th className="w-28">Day</th>
                    {periods.map((p) => (
                      <th key={p}>
                        P{p} · {PERIODS[p].start}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map((d) => (
                    <tr key={d}>
                      <td className="font-bold">{DAYS[d]}</td>
                      {periods.map((p) => {
                        const slot = cls.slots.find((s) => s.day === d && s.period === p);
                        return (
                          <td key={p}>
                            <label className="sr-only" htmlFor={`cell-${d}-${p}`}>
                              {DAYS[d]} period {p}
                            </label>
                            <select id={`cell-${d}-${p}`} name={`cell-${d}-${p}`} defaultValue={slot ? String(slot.assignmentId) : ""} className="field field-sm">
                              <option value="">Free</option>
                              {cls.assignments.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.subject.shortName} · {a.teacher.user.name.replace(/^Prof\.\s*/, "")}
                                </option>
                              ))}
                            </select>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <SubmitButton busy="Saving…">Save timetable</SubmitButton>
            </div>
          </ActionForm>
        </Card>
      )}
    </>
  );
}
