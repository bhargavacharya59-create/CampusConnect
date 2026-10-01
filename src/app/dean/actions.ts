"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { EVENT_KINDS } from "@/lib/constants";
import { parseIsoDate } from "@/lib/dates";
import type { FormState } from "@/app/actions/auth";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const refresh = () => revalidatePath("/dean", "layout");

export async function publishResults(_prev: FormState, f: FormData): Promise<FormState> {
  await requireRole("DEAN");
  const id = str(f, "assessmentId");
  const dept = str(f, "dept");
  const where = id
    ? { id: Number(id), status: "DIRECTOR_APPROVED" }
    : { status: "DIRECTOR_APPROVED", ...(dept ? { assignment: { class: { departmentId: dept } } } : {}) };
  const res = await prisma.assessment.updateMany({ where, data: { status: "PUBLISHED", publishedAt: new Date() } });
  if (!res.count) return { error: "Nothing to publish." };
  refresh();
  revalidatePath("/parent", "layout");
  revalidatePath("/student", "layout");
  return { ok: `Published ${res.count} result${res.count === 1 ? "" : "s"}. Students and parents can see them now.` };
}

export async function decideRequest(_prev: FormState, f: FormData): Promise<FormState> {
  await requireRole("DEAN");
  const r = await prisma.deanRequest.findFirst({ where: { id: str(f, "requestId"), status: "PENDING" } });
  if (!r) return { error: "This request was already decided." };
  const approve = str(f, "decision") === "approve";
  const reply = str(f, "reply").slice(0, 1000) || (approve ? "Approved." : "Not approved at this time.");
  await prisma.deanRequest.update({ where: { id: r.id }, data: { status: approve ? "APPROVED" : "REJECTED", reply, decidedAt: new Date() } });
  refresh();
  revalidatePath("/director", "layout");
  return { ok: approve ? "Approved." : "Rejected." };
}

export async function assignDirector(_prev: FormState, f: FormData): Promise<FormState> {
  await requireRole("DEAN");
  const deptId = str(f, "departmentId");
  const directorId = str(f, "directorId") || null;
  const dept = await prisma.department.findUnique({ where: { id: deptId } });
  if (!dept) return { error: "Department not found." };
  if (directorId) {
    const u = await prisma.user.findFirst({ where: { id: directorId, role: "DIRECTOR" } });
    if (!u) return { error: "Choose a Director account." };
    await prisma.$transaction([
      // A Director can lead only one department.
      prisma.department.updateMany({ where: { directorId, NOT: { id: deptId } }, data: { directorId: null } }),
      prisma.department.update({ where: { id: deptId }, data: { directorId } }),
    ]);
  } else {
    await prisma.department.update({ where: { id: deptId }, data: { directorId: null } });
  }
  revalidatePath("/dean/departments");
  return { ok: "Director updated." };
}

export async function postCollegeNotice(_prev: FormState, f: FormData): Promise<FormState> {
  const s = await requireRole("DEAN");
  const title = str(f, "title");
  const body = str(f, "body");
  const audience = str(f, "audience");
  if (!["ALL", "STUDENTS", "PARENTS", "STAFF"].includes(audience)) return { error: "Choose who should see it." };
  if (title.length < 3 || title.length > 120) return { error: "Add a short title." };
  if (body.length < 5 || body.length > 3000) return { error: "Write the notice (5–3000 characters)." };
  await prisma.notice.create({ data: { title, body, audience, departmentId: null, authorId: s.userId } });
  revalidatePath("/dean/notices");
  return { ok: "Notice posted to the whole college." };
}

export async function addCollegeEvent(_prev: FormState, f: FormData): Promise<FormState> {
  const s = await requireRole("DEAN");
  const title = str(f, "title");
  const date = parseIsoDate(str(f, "date"));
  const kind = str(f, "kind");
  if (title.length < 3 || title.length > 120) return { error: "Add a title." };
  if (!date) return { error: "Choose a date." };
  if (!(kind in EVENT_KINDS)) return { error: "Choose a type." };
  await prisma.event.create({ data: { title, date, kind, departmentId: null, createdById: s.userId } });
  revalidatePath("/dean/notices");
  return { ok: "Added to the college calendar." };
}

export async function deleteEvent(_prev: FormState, f: FormData): Promise<FormState> {
  await requireRole("DEAN");
  await prisma.event.deleteMany({ where: { id: str(f, "eventId") } });
  revalidatePath("/dean/notices");
  return { ok: "Deleted." };
}
