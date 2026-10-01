import { cache } from "react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { directorPending } from "@/lib/pending";

export const getMe = cache(async () => {
  const session = await requireRole("DIRECTOR");
  const dept = await prisma.department.findFirst({ where: { directorId: session.userId } });
  return { session, dept };
});

export const getMyPending = cache(async () => {
  const { dept } = await getMe();
  return dept ? directorPending(dept.id) : [];
});

/** For pages: the department, or throws a clear error if this Director has none. */
export async function getDept() {
  const { session, dept } = await getMe();
  if (!dept) throw new Error("This Director is not assigned to a department. Ask the Dean to assign one.");
  return { session, dept };
}
