"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/constants";

/** Marks all messages to the current user as read and refreshes their screens. */
export async function markMyMessagesRead(): Promise<void> {
  const session = await requireSession();
  await prisma.message.updateMany({ where: { toId: session.userId, readAt: null }, data: { readAt: new Date() } });
  revalidatePath(ROLE_HOME[session.role], "layout");
}
