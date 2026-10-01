import { getSession } from "@/lib/auth";
import { csvResponse, toCsv } from "@/lib/csv";

/** Example CSV for the student import (Office only). */
export async function GET() {
  const session = await getSession();
  if (session?.role !== "ADMIN") return new Response("Not allowed.", { status: 403 });
  return csvResponse(
    "student-import-template.csv",
    toCsv(["name", "class", "parent_name", "parent_phone", "admission_year", "dob", "email"], [["Asha Kulkarni", "CSE-A", "Ravi Kulkarni", "9845012345", 2026, "2008-04-17", "asha@example.com"]]),
  );
}
