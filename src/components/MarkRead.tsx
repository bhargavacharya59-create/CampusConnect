"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { markMyMessagesRead } from "@/app/actions/messages";

/** Marks incoming messages as read once the page is open, then refreshes badges. */
export function MarkRead({ hasUnread }: { hasUnread: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!hasUnread) return;
    markMyMessagesRead().then(() => router.refresh());
  }, [hasUnread, router]);
  return null;
}
