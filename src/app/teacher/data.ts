import { cache } from "react";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getTeacher } from "@/lib/queries/staff";
import { teacherPending } from "@/lib/pending";

/** Logged-in teacher (cached per request so layout and page share it). */
export const getMe = cache(async () => {
  const session = await requireRole("TEACHER");
  const teacher = await getTeacher(session.userId);
  if (!teacher) notFound();
  return { session, teacher };
});

export const getMyPending = cache(async () => {
  const { teacher } = await getMe();
  return teacherPending(teacher.id);
});
