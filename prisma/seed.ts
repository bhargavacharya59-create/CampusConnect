// Fills the database with the dummy college. Safe to re-run: it wipes the
// existing data first.  Run with:  npm run db:seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEPARTMENTS, DIRECTORS, generate } from "./data/generate";
import { istToday } from "../src/lib/dates";

const prisma = new PrismaClient();

async function inChunks<T>(rows: T[], size: number, fn: (chunk: T[]) => Promise<unknown>) {
  for (let i = 0; i < rows.length; i += size) await fn(rows.slice(i, i + size));
}

async function wipe() {
  // Children first.
  await prisma.aiSummary.deleteMany();
  await prisma.aiUsage.deleteMany();
  await prisma.meetingRequest.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.feeInvoice.deleteMany();
  await prisma.mark.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.timetableSlot.deleteMany();
  await prisma.teachingAssignment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.class.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  const today = istToday();
  const g = generate({ today });
  const password = process.env.SEED_DEFAULT_PASSWORD || "Welcome@123";
  const passwordHash = await bcrypt.hash(password, 10);

  console.log("Clearing old data…");
  await wipe();

  console.log(`Creating ${g.users.length} users…`);
  await inChunks(g.users, 500, (chunk) =>
    prisma.user.createMany({ data: chunk.map((u) => ({ ...u, passwordHash, mustChangePassword: true })) }),
  );

  console.log("Creating departments, teachers, classes, subjects…");
  await prisma.department.createMany({
    data: DEPARTMENTS.map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      directorId: DIRECTORS.find((x) => x.departmentId === d.id)!.id,
    })),
  });
  await prisma.teacher.createMany({ data: g.teachers });
  await prisma.class.createMany({ data: g.classes.map(({ index: _index, ...c }) => c) });
  await prisma.subject.createMany({ data: g.subjects });
  await prisma.teachingAssignment.createMany({ data: g.assignments.map(({ subjectIndex: _k, ...a }) => a) });
  await prisma.timetableSlot.createMany({ data: g.slots });

  console.log(`Creating ${g.students.length} students…`);
  await inChunks(g.students, 300, (chunk) =>
    prisma.student.createMany({ data: chunk.map(({ rate: _r, ability: _a, ...s }) => s) }),
  );

  console.log(`Creating ${g.sessions.length} attendance sessions and ${g.records.length} records…`);
  await inChunks(g.sessions, 500, (chunk) => prisma.attendanceSession.createMany({ data: chunk }));
  await inChunks(g.records, 5000, (chunk) => prisma.attendanceRecord.createMany({ data: chunk }));

  console.log("Creating marks, fees, notices, messages…");
  await prisma.assessment.createMany({ data: g.assessments });
  await inChunks(g.marks, 3000, (chunk) => prisma.mark.createMany({ data: chunk }));
  await inChunks(g.invoices, 1000, (chunk) => prisma.feeInvoice.createMany({ data: chunk }));
  await prisma.notice.createMany({ data: g.notices });
  await prisma.message.createMany({ data: g.messages });

  console.log("\nDone. Sample logins (password for all: " + password + ")");
  console.log("  Dean      DEAN-0001");
  console.log("  Director  DIR-0001  (CSE)");
  console.log("  Teacher   TCH-0001  (proctor of CSE-A)");
  console.log("  Student   24SUUBECS0045");
  console.log("  Parent    24SUUBECS0045P");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
