import { cache } from "react";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getStudentProfileById } from "@/lib/queries/student";
import { studentPending } from "@/lib/pending";

export const getMe = cache(async () => {
  const session = await requireRole("STUDENT");
  const me = await getStudentProfileById(session.userId);
  if (!me) notFound();
  return { session, me };
});

export const getMyPending = cache(async () => {
  const { me } = await getMe();
  return studentPending(me.id, me.classId);
});
