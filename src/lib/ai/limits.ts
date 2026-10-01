import { prisma } from "@/lib/db";
import { istToday } from "@/lib/dates";
import type { AiFeature } from "./gemini";

/** Daily request limits per user, per feature. Change these to control cost. */
const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export const DAILY_LIMIT: Record<AiFeature, number> = {
  PARENT: num(process.env.AI_LIMIT_PARENT, 30),
  ASSIGNMENT: num(process.env.AI_LIMIT_ASSIGNMENT, 10),
  TEACHER: num(process.env.AI_LIMIT_TEACHER, 50),
  ALERTS: num(process.env.AI_LIMIT_ALERTS, 20),
};

/**
 * Counts one AI request for this user. Returns false (and does not count)
 * once the daily limit is reached.
 */
export async function takeAiQuota(userId: string, feature: AiFeature): Promise<boolean> {
  const day = istToday();
  const where = { userId_feature_day: { userId, feature, day } };
  const row = await prisma.aiUsage.upsert({ where, create: { userId, feature, day, count: 0 }, update: {} });
  if (row.count >= DAILY_LIMIT[feature]) return false;
  await prisma.aiUsage.update({ where, data: { count: { increment: 1 } } });
  return true;
}

export async function aiQuotaLeft(userId: string, feature: AiFeature): Promise<number> {
  const row = await prisma.aiUsage.findUnique({ where: { userId_feature_day: { userId, feature, day: istToday() } } });
  return Math.max(0, DAILY_LIMIT[feature] - (row?.count ?? 0));
}
