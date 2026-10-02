import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getParentAndChild } from "./data";
import { BottomNav } from "./BottomNav";
import { ParentI18nProvider } from "./ParentI18nProvider";
import { ParentHeader } from "./ParentHeader";

export const metadata: Metadata = { title: "Parent" };

// The parent site is designed like a phone app. On a laptop it shows as a
// centred phone-width column; on a phone it fills the screen.
export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const { session, child } = await getParentAndChild();
  const unread = await prisma.message.count({ where: { toId: session.userId, readAt: null } });

  const childData = child
    ? {
        parentId: child.parentId,
        className: child.class.name,
        semester: child.class.semester,
        userName: child.user.name,
      }
    : null;

  return (
    <ParentI18nProvider>
      <div className="min-h-screen bg-[#DCE7E5] sm:py-6">
        <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col bg-ground sm:min-h-[calc(100vh-3rem)] sm:overflow-hidden sm:rounded-[28px] sm:shadow-[0_20px_60px_rgba(11,61,58,0.18)]">
          <ParentHeader unread={unread} child={childData} />

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
    </ParentI18nProvider>
  );
}
