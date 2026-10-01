"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { WORKING_DAYS } from "@/lib/constants";
import { addDays, istToday, isoWeekday } from "@/lib/dates";
import type { FormState } from "@/app/actions/auth";

async function parentAndChild() {
  const session = await requireRole("PARENT");
  const child = await prisma.student.findUnique({
    where: { parentId: session.userId },
    select: { id: true, class: { select: { proctorId: true } } },
  });
  return { session, child };
}

export async function sendMessageToProctor(_prev: FormState, formData: FormData): Promise<FormState> {
  const { session, child } = await parentAndChild();
  const proctorId = child?.class.proctorId;
  if (!child || !proctorId) return { error: "No proctor is assigned to this class yet." };

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Type a message first." };
  if (body.length > 1000) return { error: "Please keep the message under 1000 characters." };

  await prisma.message.create({ data: { fromId: session.userId, toId: proctorId, studentId: child.id, body } });
  revalidatePath("/parent/messages");
  return { ok: "Message sent to the proctor." };
}

export async function requestMeeting(_prev: FormState, formData: FormData): Promise<FormState> {
  const { session, child } = await parentAndChild();
  const proctorId = child?.class.proctorId;
  if (!child || !proctorId) return { error: "No proctor is assigned to this class yet." };

  const dateStr = String(formData.get("date") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return { error: "Choose a date." };
  const date = new Date(`${dateStr}T00:00:00Z`);
  const today = istToday();
  if (Number.isNaN(date.getTime()) || date <= today || date > addDays(today, 30)) {
    return { error: "Choose a date between tomorrow and the next 30 days." };
  }
  if (isoWeekday(date) > WORKING_DAYS) return { error: "Meetings can only be on working days (Monday to Friday)." };
  if (reason.length < 5) return { error: "Tell the proctor briefly what you'd like to discuss." };
  if (reason.length > 500) return { error: "Please keep the reason under 500 characters." };

  const open = await prisma.meetingRequest.count({ where: { parentId: session.userId, status: "PENDING" } });
  if (open >= 3) return { error: "You already have 3 pending requests. Please wait for a reply." };

  await prisma.meetingRequest.create({
    data: { parentId: session.userId, teacherId: proctorId, studentId: child.id, preferredDate: date, reason },
  });
  revalidatePath("/parent/messages");
  return { ok: "Meeting request sent. You'll see the proctor's reply here." };
}

export async function markMessagesRead(): Promise<void> {
  const session = await requireRole("PARENT");
  await prisma.message.updateMany({ where: { toId: session.userId, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/parent", "layout");
}
