import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { StudentSearch } from "@/components/StudentDetail";

export const metadata: Metadata = { title: "Find a student" };

export default async function DeanStudents({ searchParams }: { searchParams: { q?: string } }) {
  await requireRole("DEAN");
  return (
    <>
      <PageHeader title="Find a student" subtitle="Search any student in the college" />
      <StudentSearch q={searchParams.q ?? ""} base="/dean/students" />
    </>
  );
}
