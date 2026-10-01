import type { Metadata } from "next";
import { isAiEnabled } from "@/lib/ai/gemini";
import { aiQuotaLeft } from "@/lib/ai/limits";
import { getParentAndChild } from "../data";
import { AssistantChat } from "./AssistantChat";

export const metadata: Metadata = { title: "Ask AI" };

export default async function AssistantPage() {
  const { session, child } = await getParentAndChild();
  if (!child) return null;
  const enabled = isAiEnabled("PARENT");
  const left = enabled ? await aiQuotaLeft(session.userId, "PARENT") : 0;

  return <AssistantChat enabled={enabled} firstName={child.user.name.split(" ")[0]} initialLeft={left} />;
}
