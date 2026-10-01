"use server";

// Teacher AI tools (Gemini key 3: GEMINI_KEY_TEACHER).
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ATTENDANCE_THRESHOLD, COLLEGE_NAME } from "@/lib/constants";
import { AiError, generateText, isAiEnabled } from "@/lib/ai/gemini";
import { takeAiQuota } from "@/lib/ai/limits";
import { buildStudentContext } from "@/lib/ai/studentContext";
import { getStudentProfileByParent } from "@/lib/queries/student";
import { classAttendance, getTeacher } from "@/lib/queries/staff";
import type { AiFormState } from "@/components/forms";

async function start(): Promise<{ teacherId: string; error?: string }> {
  const s = await requireRole("TEACHER");
  if (!isAiEnabled("TEACHER")) return { teacherId: s.userId, error: "AI tools are not switched on. Add GEMINI_KEY_TEACHER in the .env file." };
  if (!(await takeAiQuota(s.userId, "TEACHER"))) return { teacherId: s.userId, error: "You've reached today's AI limit. Try again tomorrow." };
  return { teacherId: s.userId };
}

const fail = (e: unknown): AiFormState => {
  console.error("[ai] teacher:", e);
  return { error: e instanceof AiError ? e.userMessage : "Something went wrong. Please try again." };
};

export async function proctorClassSummary(_prev: AiFormState, _f: FormData): Promise<AiFormState> {
  const { teacherId, error } = await start();
  if (error) return { error };
  const t = await getTeacher(teacherId);
  if (!t?.proctorOf) return { error: "You are not a proctor of any class." };
  try {
    const data = await classAttendance(t.proctorOf.id);
    const lines = [
      `Class ${t.proctorOf.name}, ${data.rows.length} students. Overall attendance ${data.overall}%. Minimum required ${ATTENDANCE_THRESHOLD}%.`,
      "Subject attendance: " + data.subjects.map((s) => `${s.name} ${s.pct}% (teacher ${s.teacher})`).join("; "),
      `Students below ${ATTENDANCE_THRESHOLD}% overall or in a subject (${data.low.length}):`,
      ...data.low.slice(0, 25).map((r) => `- ${r.name} (${r.id}): overall ${r.overall}%, ` + Object.entries(r.bySubject).filter(([, v]) => v < ATTENDANCE_THRESHOLD).map(([k, v]) => `${k} ${v}%`).join(", ")),
    ];
    const text = await generateText({
      feature: "TEACHER",
      system: `You help a proctor (class mentor) at ${COLLEGE_NAME}. Using ONLY the data, write a short, practical summary in plain English, no markdown headings:
1) one line on the class overall, 2) the students who need attention first and why (max 6 names),
3) the weakest subject(s), 4) three concrete actions for this week. Keep it under 180 words.`,
      turns: [{ role: "user", parts: [{ text: lines.join("\n") }] }],
      temperature: 0.3,
      maxOutputTokens: 700,
    });
    return { text };
  } catch (e) {
    return fail(e);
  }
}

export async function draftParentMessage(_prev: AiFormState, f: FormData): Promise<AiFormState> {
  const studentId = String(f.get("studentId") ?? "").trim().toUpperCase();
  const purpose = String(f.get("purpose") ?? "").trim().slice(0, 600);
  const language = String(f.get("language") ?? "English");
  if (!studentId || purpose.length < 3) return { error: "Choose a student and say what the message is about." };
  const { teacherId, error } = await start();
  if (error) return { error };
  const student = await prisma.student.findFirst({
    where: { id: studentId, class: { OR: [{ proctorId: teacherId }, { assignments: { some: { teacherId } } }] } },
    select: { parentId: true },
  });
  if (!student) return { error: "You can only write to parents of students you teach." };
  try {
    const profile = await getStudentProfileByParent(student.parentId);
    if (!profile) return { error: "Student not found." };
    const teacher = await getTeacher(teacherId);
    const data = await buildStudentContext(profile);
    const text = await generateText({
      feature: "TEACHER",
      system: `You draft short, respectful messages from a teacher at ${COLLEGE_NAME} to a student's parent in India.
Write in ${["English", "Kannada", "Hindi"].includes(language) ? language : "English"}. 60-120 words, warm and clear, no markdown.
Use facts ONLY from the DATA; never invent numbers. Sign off as "${teacher?.user.name ?? "Teacher"}".

DATA
${data}`,
      turns: [{ role: "user", parts: [{ text: `Purpose of the message: ${purpose}` }] }],
      temperature: 0.5,
      maxOutputTokens: 600,
    });
    return { text };
  } catch (e) {
    return fail(e);
  }
}

export async function generateQuestions(_prev: AiFormState, f: FormData): Promise<AiFormState> {
  const subject = String(f.get("subject") ?? "").trim().slice(0, 100);
  const topic = String(f.get("topic") ?? "").trim().slice(0, 300);
  const count = Math.min(15, Math.max(1, Number(f.get("count")) || 5));
  const kind = String(f.get("kind") ?? "Short answer");
  const level = String(f.get("level") ?? "Medium");
  if (!subject || topic.length < 2) return { error: "Choose a subject and enter a topic." };
  const { error } = await start();
  if (error) return { error };
  try {
    const text = await generateText({
      feature: "TEACHER",
      system: `You write exam and assignment questions for 5th-semester B.E. students at an Indian engineering college (VTU-style).
Plain text only, numbered. After all questions, add "Answer key:" with brief answers or marking points.`,
      turns: [{ role: "user", parts: [{ text: `Subject: ${subject}\nTopic: ${topic}\nNumber of questions: ${count}\nType: ${kind}\nDifficulty: ${level}` }] }],
      temperature: 0.7,
      maxOutputTokens: 1800,
    });
    return { text };
  } catch (e) {
    return fail(e);
  }
}
