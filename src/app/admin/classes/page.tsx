import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { setProctor, setSubjectTeacher } from "../actions";

export const metadata: Metadata = { title: "Classes & teachers" };

export default async function AdminClasses({ searchParams }: { searchParams: { class?: string } }) {
  await requireRole("ADMIN");
  const [classes, teachers] = await Promise.all([
    prisma.class.findMany({
      orderBy: { id: "asc" },
      include: { _count: { select: { students: true } }, assignments: { include: { subject: true }, orderBy: { subjectId: "asc" } } },
    }),
    prisma.teacher.findMany({ orderBy: { id: "asc" }, include: { user: { select: { name: true } } } }),
  ]);
  const selected = classes.find((c) => c.id === searchParams.class) ?? classes[0];

  return (
    <>
      <PageHeader title="Classes & teachers" subtitle="Set each class's proctor and who teaches each subject. Changes that would double-book a teacher are refused." />
      <div className="flex flex-wrap gap-2">
        {classes.map((c) => (
          <Link key={c.id} href={`/admin/classes?class=${c.id}`} className={c.id === selected?.id ? "btn btn-sm" : "btn-outline btn-sm"}>
            {c.id} · {c._count.students}
          </Link>
        ))}
      </div>
      {selected && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title={`Proctor of ${selected.id}`}>
            <ActionForm action={setProctor} className="flex items-end gap-2" resetOnSuccess={false}>
              <input type="hidden" name="classId" value={selected.id} />
              <label htmlFor="proctor" className="sr-only">
                Proctor
              </label>
              <select id="proctor" name="teacherId" defaultValue={selected.proctorId ?? ""} className="field flex-1">
                <option value="">No proctor</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.user.name} ({t.id})
                  </option>
                ))}
              </select>
              <SubmitButton className="btn">Save</SubmitButton>
            </ActionForm>
          </Card>
          <Card title={`Subjects of ${selected.id}`}>
            {selected.assignments.map((a) => (
              <ActionForm key={a.id} action={setSubjectTeacher} className="flex flex-wrap items-end gap-2 border-b border-line-soft py-2.5 last:border-b-0" resetOnSuccess={false}>
                <input type="hidden" name="assignmentId" value={a.id} />
                <label htmlFor={`t-${a.id}`} className="w-40 text-sm font-bold">
                  {a.subject.name}
                </label>
                <select id={`t-${a.id}`} name="teacherId" defaultValue={a.teacherId} className="field field-sm flex-1">
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.user.name} ({t.id})
                    </option>
                  ))}
                </select>
                <SubmitButton className="btn-outline btn-sm h-10">Save</SubmitButton>
              </ActionForm>
            ))}
          </Card>
        </div>
      )}
    </>
  );
}
