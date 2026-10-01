import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getStudentProfileById } from "@/lib/queries/student";
import { PageHeader } from "@/components/ui";
import { StudentDetail } from "@/components/StudentDetail";

export const metadata: Metadata = { title: "Student" };

export default async function AdminStudent({ params }: { params: { id: string } }) {
  await requireRole("ADMIN");
  const student = await getStudentProfileById(decodeURIComponent(params.id).toUpperCase());
  if (!student) notFound();
  return (
    <>
      <PageHeader
        title={student.user.name}
        subtitle={
          <>
            <span className="font-mono">{student.id}</span> · parent <span className="font-mono">{student.parentId}</span> ·{" "}
            <Link href={`/admin/fees?student=${student.id}`} className="link">
              Fees
            </Link>{" "}
            ·{" "}
            <Link href={`/admin/users?q=${student.id}`} className="link">
              Reset passwords
            </Link>
          </>
        }
      />
      <StudentDetail student={student} />
    </>
  );
}
