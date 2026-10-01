"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { UPLOAD_MAX_BYTES, UPLOAD_TYPES } from "@/lib/constants";
import { addDays, istToday } from "@/lib/dates";
import { aiCheckSubmission, assignmentAiEnabled } from "@/lib/ai/assignment";
import { takeAiQuota } from "@/lib/ai/limits";
import type { FormState } from "@/app/actions/auth";

/** Student submits (or resubmits) homework: typed answer and/or one photo/PDF. */
export async function submitHomework(_prev: FormState, f: FormData): Promise<FormState> {
  const session = await requireRole("STUDENT");
  const courseworkId = Number(f.get("courseworkId"));
  const student = await prisma.student.findUnique({ where: { id: session.userId }, select: { id: true, classId: true } });
  if (!student) return { error: "Student not found." };
  const cw = await prisma.coursework.findFirst({ where: { id: courseworkId, assignment: { classId: student.classId } } });
  if (!cw) return { error: "Assignment not found." };

  const existing = await prisma.submission.findUnique({ where: { courseworkId_studentId: { courseworkId: cw.id, studentId: student.id } } });
  if (existing?.status === "APPROVED") return { error: "This assignment is already marked." };
  // Late work is accepted for 7 days after the due date (shown as late to the teacher).
  if (istToday() > addDays(cw.dueDate, 7)) return { error: "The submission window for this assignment has closed." };

  const text = String(f.get("text") ?? "").trim();
  if (text.length > 10_000) return { error: "Please keep the typed answer under 10,000 characters." };

  const file = f.get("file");
  let fileData: Buffer | null = null;
  let fileName: string | null = null;
  let fileMime: string | null = null;
  if (file && typeof file === "object" && "arrayBuffer" in file && file.size > 0) {
    if (file.size > UPLOAD_MAX_BYTES) return { error: "The file is larger than 5 MB. Please upload a smaller photo or PDF." };
    if (!(UPLOAD_TYPES as readonly string[]).includes(file.type)) return { error: "Upload a JPG, PNG, WEBP photo or a PDF." };
    fileData = Buffer.from(await file.arrayBuffer());
    fileName = (file.name || "upload").slice(0, 120);
    fileMime = file.type;
  }
  const keepOldFile = !fileData && existing?.fileData;
  if (!text && !fileData && !keepOldFile) return { error: "Type your answer or upload a photo/PDF of your work." };

  const data = {
    text: text || null,
    ...(fileData ? { fileData, fileName, fileMime } : {}),
    submittedAt: new Date(),
    status: "SUBMITTED",
    aiScore: null,
    aiFeedback: null,
    aiCheckedAt: null,
    finalScore: null,
    teacherComment: null,
    reviewedAt: null,
  };
  const sub = await prisma.submission.upsert({
    where: { courseworkId_studentId: { courseworkId: cw.id, studentId: student.id } },
    create: { courseworkId: cw.id, studentId: student.id, ...data },
    update: data,
  });

  let note = "Submitted. Your teacher will review it.";
  if (assignmentAiEnabled() && (await takeAiQuota(session.userId, "ASSIGNMENT"))) {
    const r = await aiCheckSubmission(sub.id);
    note = r.ok ? "Submitted and checked by AI. See the feedback below; your teacher will confirm the marks." : "Submitted. The AI check didn't work this time; your teacher will mark it.";
  }
  revalidatePath("/student", "layout");
  revalidatePath("/teacher", "layout");
  return { ok: note };
}
