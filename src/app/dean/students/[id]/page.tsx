import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getStudentProfileById } from "@/lib/queries/student";
import { PageHeader } from "@/components/ui";
import { StudentDetail } from "@/components/StudentDetail";

export const metadata: Metadata = { title: "Student" };

export default async function DeanStudent({ params }: { params: { id: string } }) {
  await requireRole("DEAN");
  const student = await getStudentProfileById(decodeURIComponent(params.id).toUpperCase());
  if (!student) notFound();
  return (
    <>
      <PageHeader
        title={student.user.name}
        subtitle={
          <>
            <span className="font-mono">{student.id}</span> · {student.class.name} ·{" "}
            <Link href="/dean/students" className="link">
              Search again
            </Link>
          </>
        }
      />
      <StudentDetail student={student} />
    </>
  );
}
