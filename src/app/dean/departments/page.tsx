import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { assignDirector } from "../actions";

export const metadata: Metadata = { title: "Departments" };

export default async function DeanDepartments() {
  await requireRole("DEAN");
  const [depts, directors] = await Promise.all([
    prisma.department.findMany({
      orderBy: { id: "asc" },
      include: {
        director: { select: { id: true, name: true, phone: true, email: true } },
        classes: { include: { proctor: { include: { user: { select: { name: true } } } }, _count: { select: { students: true } } }, orderBy: { id: "asc" } },
        teachers: { include: { user: { select: { name: true } } }, orderBy: { id: "asc" } },
      },
    }),
    prisma.user.findMany({ where: { role: "DIRECTOR" }, orderBy: { id: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <PageHeader title="Departments" subtitle="Directors, classes, proctors and teachers. New Director accounts are created by the College Office." />
      <div className="grid gap-4 lg:grid-cols-3">
        {depts.map((d) => (
          <Card key={d.id} title={d.name}>
            <div className="text-sm">
              <div className="text-xs font-bold uppercase tracking-wide text-ink-muted">Director</div>
              <div className="font-extrabold">{d.director?.name ?? "Not assigned"}</div>
              {d.director && (
                <div className="text-xs text-ink-muted">
                  {d.director.id} · {d.director.phone} · {d.director.email}
                </div>
              )}
            </div>
            <ActionForm action={assignDirector} className="mt-2 flex items-end gap-2" resetOnSuccess={false}>
              <input type="hidden" name="departmentId" value={d.id} />
              <label htmlFor={`dir-${d.id}`} className="sr-only">
                Director
              </label>
              <select id={`dir-${d.id}`} name="directorId" defaultValue={d.directorId ?? ""} className="field field-sm flex-1">
                <option value="">No Director</option>
                {directors.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.id})
                  </option>
                ))}
              </select>
              <SubmitButton className="btn-outline btn-sm h-10">Change</SubmitButton>
            </ActionForm>
            <div className="mt-4 text-xs font-bold uppercase tracking-wide text-ink-muted">Classes</div>
            {d.classes.map((c) => (
              <div key={c.id} className="row">
                <span>
                  <b>{c.id}</b> · Sem {c.semester}
                </span>
                <span className="text-ink-muted">
                  {c._count.students} students · {c.proctor?.user.name ?? "no proctor"}
                </span>
              </div>
            ))}
            <div className="mt-4 text-xs font-bold uppercase tracking-wide text-ink-muted">Teachers</div>
            {d.teachers.map((t) => (
              <div key={t.id} className="row">
                <span>{t.user.name}</span>
                <span className="text-ink-muted">{t.id}</span>
              </div>
            ))}
          </Card>
        ))}
      </div>
    </>
  );
}
