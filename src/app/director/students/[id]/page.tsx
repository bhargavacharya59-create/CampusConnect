import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudentProfileById } from "@/lib/queries/student";
import { PageHeader } from "@/components/ui";
import { StudentDetail } from "@/components/StudentDetail";
import { getDept } from "../../data";

export const metadata: Metadata = { title: "Student" };

export default async function DirectorStudent({ params }: { params: { id: string } }) {
  const { dept } = await getDept();
  const student = await getStudentProfileById(decodeURIComponent(params.id).toUpperCase());
  if (!student || student.class.departmentId !== dept.id) notFound();
  return (
    <>
      <PageHeader
        title={student.user.name}
        subtitle={
          <>
            <span className="font-mono">{student.id}</span> · {student.class.name} ·{" "}
            <Link href="/director/students" className="link">
              Search again
            </Link>
          </>
        }
      />
      <StudentDetail student={student} />
    </>
  );
}
