import type { Role } from "./constants";

// Login ID formats
//   Student : 24SUUBECS0302   (year + college + degree + dept + roll)
//   Parent  : 24SUUBECS0302P  (student ID + "P")
//   Teacher : TCH-0001
//   Director: DIR-0001
//   Dean    : DEAN-0001

const STUDENT_RE = /^(\d{2})SUUBE(CS|DS|AI)(\d{4})$/;
const PARENT_RE = /^(\d{2})SUUBE(CS|DS|AI)(\d{4})P$/;

const DEPT_BY_CODE: Record<string, string> = { CS: "CSE", DS: "Data Science", AI: "AIML" };

export function normalizeId(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function detectRole(rawId: string): Role | null {
  const id = normalizeId(rawId);
  if (PARENT_RE.test(id)) return "PARENT";
  if (STUDENT_RE.test(id)) return "STUDENT";
  if (/^TCH-\d{4}$/.test(id)) return "TEACHER";
  if (/^DIR-\d{4}$/.test(id)) return "DIRECTOR";
  if (/^DEAN-\d{4}$/.test(id)) return "DEAN";
  return null;
}

/** Department name for a student or parent ID, e.g. "CSE". */
export function departmentFromId(rawId: string): string | null {
  const m = normalizeId(rawId).match(/^\d{2}SUUBE(CS|DS|AI)\d{4}P?$/);
  return m ? DEPT_BY_CODE[m[1]] : null;
}

export function studentIdFromParentId(parentId: string): string {
  return normalizeId(parentId).replace(/P$/, "");
}

export function parentIdFor(studentId: string): string {
  return normalizeId(studentId) + "P";
}

export function makeStudentId(year: number, deptCode: string, roll: number): string {
  return `${String(year % 100).padStart(2, "0")}SUUBE${deptCode}${String(roll).padStart(4, "0")}`;
}
