import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { COLLEGE_NAME } from "@/lib/constants";
import { getParentAndChild } from "./data";
import { Logo } from "@/components/Logo";
import { BellIcon, UserIcon } from "@/components/icons";
import { BottomNav } from "./BottomNav";

export const metadata: Metadata = { title: "Parent" };

// The parent site is designed like a phone app. On a laptop it shows as a
// centred phone-width column; on a phone it fills the screen.
export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const { session, child } = await getParentAndChild();
  const unread = await prisma.message.count({ where: { toId: session.userId, readAt: null } });

  return (
    <div className="min-h-screen bg-[#DCE7E5] sm:py-6">
      <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col bg-ground sm:min-h-[calc(100vh-3rem)] sm:overflow-hidden sm:rounded-[28px] sm:shadow-[0_20px_60px_rgba(11,61,58,0.18)]">
        <header className="bg-brand-900 px-5 pb-14 pt-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Logo size={34} />
              <span className="text-[15px] font-extrabold">{COLLEGE_NAME}</span>
            </div>
            <div className="no-print flex items-center gap-2">
              <Link
                href="/parent/messages"
                aria-label={unread ? `Messages, ${unread} unread` : "Messages"}
                className="relative flex h-11 w-11 items-center justify-center rounded-full bg-brand-800 hover:bg-brand-700"
              >
                <BellIcon size={20} />
                {unread > 0 && <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-gold ring-2 ring-brand-800" />}
              </Link>
              <Link href="/parent/account" aria-label="Account" className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-800 hover:bg-brand-700">
                <UserIcon size={20} />
              </Link>
            </div>
          </div>
          {child && (
            <div className="mt-4">
              <div className="text-[13px] text-brand-200">Parent of</div>
              <div className="text-2xl font-extrabold">{child.user.name}</div>
              <div className="mt-0.5 font-mono text-xs text-brand-200">
                {child.parentId} · {child.class.name} · Sem {child.class.semester}
              </div>
            </div>
          )}
        </header>

        <main className="-mt-10 flex flex-1 flex-col gap-3 px-4 pb-6">
          {child ? (
            children
          ) : (
            <div className="card">
              <h1 className="font-extrabold">No student linked</h1>
              <p className="mt-1 text-sm text-ink-muted">This parent ID is not linked to a student yet. Please contact the college office.</p>
            </div>
          )}
        </main>

        <BottomNav unread={unread} />
      </div>
    </div>
  );
}
