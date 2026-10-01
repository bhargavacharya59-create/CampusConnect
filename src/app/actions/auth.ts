"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { endSession, requireSession, startSession } from "@/lib/auth";
import { ROLE_HOME, ROLES, type Role } from "@/lib/constants";
import { normalizeId } from "@/lib/ids";

export interface FormState {
  error?: string;
  ok?: string;
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = normalizeId(String(formData.get("id") ?? ""));
  const password = String(formData.get("password") ?? "");
  if (!id || !password) return { error: "Enter your ID and password." };

  const user = await prisma.user.findUnique({ where: { id } });
  // Same message for unknown ID and wrong password, so IDs can't be guessed.
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !valid) return { error: "That ID and password don't match. Please try again." };
  if (!ROLES.includes(user.role as Role)) return { error: "This account has no valid role. Contact the college office." };

  const role = user.role as Role;
  await startSession({ userId: user.id, role, name: user.name });
  redirect(ROLE_HOME[role]);
}

export async function logout() {
  endSession();
  redirect("/login");
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (next.length < 8) return { error: "New password must be at least 8 characters." };
  if (!/[A-Za-z]/.test(next) || !/\d/.test(next)) return { error: "Use at least one letter and one number." };
  if (next !== confirm) return { error: "The two new passwords don't match." };

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) return { error: "Current password is wrong." };
  if (await bcrypt.compare(next, user.passwordHash)) return { error: "New password must be different from the current one." };

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(next, 10), mustChangePassword: false },
  });
  return { ok: "Password changed." };
}
