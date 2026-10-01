import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { istToday } from "@/lib/dates";
import { Card, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { StudentSearch } from "@/components/StudentDetail";
import { addStudent } from "../actions";

export const metadata: Metadata = { title: "Add student" };

export default async function AdminStudents({ searchParams }: { searchParams: { q?: string } }) {
  await requireRole("ADMIN");
  const classes = await prisma.class.findMany({ orderBy: { id: "asc" }, include: { _count: { select: { students: true } } } });
  return (
    <>
      <PageHeader
        title="Students"
        subtitle={
          <>
            Add one student at a time, or{" "}
            <Link href="/admin/import" className="link">
              import many from Excel
            </Link>
            . A parent login (student ID + P) is created automatically.
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[440px_1fr]">
        <Card title="Add a student">
          <ActionForm action={addStudent}>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="label">
                Student name
              </label>
              <input id="name" name="name" required className="field" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="classId" className="label">
                  Class
                </label>
                <select id="classId" name="classId" className="field">
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} ({c._count.students})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="year" className="label">
                  Admission year
                </label>
                <input id="year" name="year" type="number" min={2000} max={2099} defaultValue={istToday().getUTCFullYear()} className="field" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="dob" className="label">
                  Date of birth
                </label>
                <input id="dob" name="dob" type="date" className="field" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="label">
                  Email (optional)
                </label>
                <input id="email" name="email" type="email" className="field" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="parentName" className="label">
                  Parent name
                </label>
                <input id="parentName" name="parentName" required className="field" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="parentPhone" className="label">
                  Parent mobile
                </label>
                <input id="parentPhone" name="parentPhone" inputMode="tel" required placeholder="98xxxxxxxx" className="field" />
              </div>
            </div>
            <SubmitButton busy="Creating…">Create student and parent logins</SubmitButton>
          </ActionForm>
        </Card>
        <div className="flex flex-col gap-4">
          <StudentSearch q={searchParams.q ?? ""} base="/admin/students" />
        </div>
      </div>
    </>
  );
}
