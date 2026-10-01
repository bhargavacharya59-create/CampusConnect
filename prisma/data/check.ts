// Sanity checks for the dummy-data generator and attendance maths.
// Run with:  npx tsx prisma/data/check.ts
import assert from "node:assert/strict";
import { generate } from "./generate";
import { istToday } from "../../src/lib/dates";
import { classesNeeded, classesCanMiss, percent } from "../../src/lib/attendance";
import { detectRole, studentIdFromParentId } from "../../src/lib/ids";

const today = istToday(new Date("2026-10-01T10:00:00Z")); // a Thursday
const g = generate({ today });

// Counts
assert.equal(g.classes.length, 10);
assert.equal(g.teachers.length, 10);
assert.equal(g.students.length, 600);
assert.equal(g.users.filter((u) => u.role === "PARENT").length, 600);
assert.equal(g.users.filter((u) => u.role === "DIRECTOR").length, 3);
assert.equal(g.users.filter((u) => u.role === "DEAN").length, 1);
assert.equal(new Set(g.users.map((u) => u.id)).size, g.users.length, "user IDs unique");
for (const c of g.classes) assert.equal(g.students.filter((s) => s.classId === c.id).length, 60, `${c.id} has 60`);

// Every teacher is proctor of exactly one class and teaches 5 class-subjects across >= 3 classes
assert.equal(new Set(g.classes.map((c) => c.proctorId)).size, 10);
for (const t of g.teachers) {
  const mine = g.assignments.filter((a) => a.teacherId === t.id);
  assert.equal(mine.length, 5, `${t.id} teaches 5`);
  const proctorClass = g.classes.find((c) => c.proctorId === t.id)!;
  assert.ok(mine.some((a) => a.classId === proctorClass.id), `${t.id} teaches own proctor class`);
}

// Timetable: each class has 25 slots, each subject 5 times, no teacher in two places at once
const asg = new Map(g.assignments.map((a) => [a.id, a]));
for (const c of g.classes) {
  const s = g.slots.filter((x) => x.classId === c.id);
  assert.equal(s.length, 25);
  const counts = new Map<number, number>();
  for (const x of s) counts.set(x.assignmentId, (counts.get(x.assignmentId) ?? 0) + 1);
  assert.deepEqual([...counts.values()], [5, 5, 5, 5, 5]);
}
const busy = new Set<string>();
for (const x of g.slots) {
  const key = `${asg.get(x.assignmentId)!.teacherId}-${x.day}-${x.period}`;
  assert.ok(!busy.has(key), `teacher clash ${key}`);
  busy.add(key);
}

// IDs
assert.ok(g.students.some((s) => s.id === "24SUUBECS0045"));
assert.ok(g.students.some((s) => s.id === "24SUUBEDS0180"));
assert.ok(g.students.some((s) => s.id === "24SUUBEAI0001"));
assert.equal(detectRole("24SUUBECS0302"), "STUDENT");
assert.equal(detectRole("24suubecs0302p"), "PARENT");
assert.equal(detectRole("TCH-0001"), "TEACHER");
assert.equal(detectRole("DIR-0002"), "DIRECTOR");
assert.equal(detectRole("DEAN-0001"), "DEAN");
assert.equal(detectRole("hello"), null);
assert.equal(studentIdFromParentId("24SUUBECS0302P"), "24SUUBECS0302");

// Attendance maths
assert.equal(classesNeeded(68, 100), 28); // (68+28)/(128) = 75%
assert.equal(classesNeeded(75, 100), 0);
assert.equal(classesNeeded(74, 100), 4); // 78/104 = 75%
assert.equal(classesCanMiss(90, 100), 20); // 90/120 = 75%
assert.equal(classesCanMiss(70, 100), 0);
assert.equal(percent(2, 3), 66.7);

// Attendance distribution
const byStudent = new Map<string, { p: number; t: number }>();
for (const r of g.records) {
  const e = byStudent.get(r.studentId) ?? { p: 0, t: 0 };
  e.t++;
  if (r.status === "P") e.p++;
  byStudent.set(r.studentId, e);
}
const pcts = [...byStudent.values()].map((e) => (e.p / e.t) * 100);
const low = pcts.filter((p) => p < 75).length;
const avg = pcts.reduce((a, b) => a + b, 0) / pcts.length;
const sneha = byStudent.get("24SUUBECS0045")!;

console.log("users", g.users.length, "sessions", g.sessions.length, "records", g.records.length);
console.log("marks", g.marks.length, "invoices", g.invoices.length);
console.log("avg attendance", avg.toFixed(1), "below 75%:", low);
console.log("Sneha", ((sneha.p / sneha.t) * 100).toFixed(1), "% of", sneha.t, "needs", classesNeeded(sneha.p, sneha.t));
console.log("today sessions", g.sessions.filter((s) => s.date.getTime() === today.getTime()).length);
console.log("teacher of CSE-A by subject:", g.assignments.filter((a) => a.classId === "CSE-A").map((a) => a.teacherId).join(", "));
assert.ok(low >= 20 && low <= 70, "a realistic number of low-attendance students");
console.log("All checks passed.");
