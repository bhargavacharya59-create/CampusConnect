import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { importStudents } from "../actions";

export const metadata: Metadata = { title: "Import from Excel" };

export default async function AdminImport() {
  await requireRole("ADMIN");
  const classes = await prisma.class.findMany({ orderBy: { id: "asc" }, select: { id: true } });
  return (
    <>
      <PageHeader title="Import students from Excel" subtitle="Bring in the college's real student list. Parent logins are created automatically." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="1. Prepare the file">
          <ol className="list-decimal space-y-1.5 pl-5 text-sm">
            <li>
              <a href="/api/import-template" className="link">
                Download the template
              </a>{" "}
              and open it in Excel.
            </li>
            <li>
              One student per row. Columns: <b>name, class, parent_name, parent_phone</b> (required), admission_year, dob (yyyy-mm-dd), email.
            </li>
            <li>
              <b>class</b> must be one of: {classes.map((c) => c.id).join(", ")}.
            </li>
            <li>
              In Excel choose <b>File → Save As → CSV UTF-8</b>.
            </li>
          </ol>
          <p className="mt-3 text-sm text-ink-muted">Student IDs are created automatically, e.g. 26SUUBECS0241. New accounts get the default password set in the .env file and must change it after signing in.</p>
        </Card>
        <Card title="2. Upload">
          <ActionForm action={importStudents}>
            <label htmlFor="file" className="label">
              CSV file
            </label>
            <input id="file" name="file" type="file" accept=".csv,text/csv" required className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-ground file:px-3 file:py-2 file:font-bold" />
            <div>
              <SubmitButton busy="Importing… this can take a minute">Import students</SubmitButton>
            </div>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
