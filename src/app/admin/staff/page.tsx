import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { addStaff } from "../actions";

export const metadata: Metadata = { title: "Add staff" };

export default async function AdminStaff() {
  await requireRole("ADMIN");
  const [depts, staff] = await Promise.all([
    prisma.department.findMany({ orderBy: { id: "asc" } }),
    prisma.user.findMany({ where: { role: { in: ["DEAN", "DIRECTOR", "TEACHER", "ADMIN"] } }, orderBy: { id: "asc" }, select: { id: true, name: true, role: true, phone: true } }),
  ]);
  return (
    <>
      <PageHeader title="Staff accounts" subtitle="IDs are given automatically: TCH-0011, DIR-0004 and so on" />
      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <Card title="Add a staff member">
          <ActionForm action={addStaff}>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="role" className="label">
                Role
              </label>
              <select id="role" name="role" className="field">
                <option value="TEACHER">Teacher</option>
                <option value="DIRECTOR">Director</option>
                <option value="DEAN">Dean</option>
                <option value="ADMIN">College Office</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="label">
                Full name
              </label>
              <input id="name" name="name" required placeholder="Prof. Asha Rao" className="field" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="departmentId" className="label">
                  Department (teachers)
                </label>
                <select id="departmentId" name="departmentId" className="field">
                  {depts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="designation" className="label">
                  Designation
                </label>
                <input id="designation" name="designation" defaultValue="Assistant Professor" className="field" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className="label">
                  Mobile
                </label>
                <input id="phone" name="phone" inputMode="tel" className="field" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="label">
                  Email
                </label>
                <input id="email" name="email" type="email" className="field" />
              </div>
            </div>
            <SubmitButton busy="Creating…">Create account</SubmitButton>
            <p className="text-xs text-ink-muted">After creating a Director, the Dean assigns them to a department. After creating a teacher, set their classes in Classes &amp; teachers.</p>
          </ActionForm>
        </Card>
        <Card title={`All staff (${staff.length})`}>
          {staff.map((s) => (
            <div key={s.id} className="row">
              <span>
                <b>{s.name}</b> <span className="font-mono text-xs text-ink-muted">{s.id}</span>
              </span>
              <span className="text-sm text-ink-muted">{s.phone}</span>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}
