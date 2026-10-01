import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { StudentSearch } from "@/components/StudentDetail";
import { getDept } from "../data";

export const metadata: Metadata = { title: "Find a student" };

export default async function DirectorStudents({ searchParams }: { searchParams: { q?: string } }) {
  const { dept } = await getDept();
  return (
    <>
      <PageHeader title="Find a student" subtitle={`Students of ${dept.name}`} />
      <StudentSearch q={searchParams.q ?? ""} base="/director/students" departmentId={dept.id} />
    </>
  );
}
