import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { COLLEGE_NAME, COLLEGE_SHORT } from "@/lib/constants";
import { initials } from "@/lib/format";
import { SideNav, type NavItem } from "./SideNav";

export type Theme = "brand" | "pending" | "clear";

function Brand({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[color:var(--logo-bg)] text-[15px] font-extrabold text-[color:var(--logo-text)]">
        {COLLEGE_SHORT}
      </div>
      <div className="min-w-0">
        <div className="truncate text-[15px] font-extrabold text-[color:var(--side-strong)]">{COLLEGE_NAME}</div>
        <div className="truncate text-xs text-[color:var(--side-text)]">{subtitle}</div>
      </div>
    </div>
  );
}

function Footer({ userName }: { userName: string }) {
  return (
    <div className="mt-auto flex flex-col gap-2 border-t border-white/10 pt-4">
      <Link href="/account" className="flex items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-sm text-[color:var(--side-text)] hover:text-[color:var(--side-strong)]">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--count-bg)] text-xs font-extrabold text-[color:var(--count-text)]">{initials(userName)}</span>
        <span className="min-w-0 truncate font-semibold">{userName}</span>
      </Link>
      <form action={logout}>
        <button type="submit" className="w-full rounded-[10px] px-3.5 py-2 text-left text-sm font-semibold text-[color:var(--side-text)] hover:text-[color:var(--side-strong)]">
          Sign out
        </button>
      </form>
    </div>
  );
}

/** Reminds users who are still on their first-time password. */
async function PasswordReminder({ userId }: { userId: string }) {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { mustChangePassword: true } });
  if (!u?.mustChangePassword) return null;
  return (
    <Link href="/account" className="flex items-center justify-between gap-3 rounded-2xl border border-warn-50 bg-warn-50 px-4 py-3 text-sm text-warn-900 hover:border-warn-800">
      <span>
        <b>You&apos;re using a first-time password.</b> Change it to keep your account safe.
      </span>
      <span className="font-bold">Change now →</span>
    </Link>
  );
}

/**
 * Layout for Office, Dean, Director, Teacher and Student screens.
 * Sidebar on large screens, a collapsible menu on phones.
 */
export function StaffShell({
  theme,
  subtitle,
  userId,
  userName,
  nav,
  home,
  children,
}: {
  theme: Theme;
  subtitle: string;
  userId: string;
  userName: string;
  nav: NavItem[];
  home: string;
  children: React.ReactNode;
}) {
  return (
    <div data-theme={theme} className="min-h-screen bg-[color:var(--ground)] lg:flex">
      {/* Phone / tablet top bar */}
      <details className="group sticky top-0 z-20 border-b border-[color:var(--side-border)] bg-[color:var(--side-bg)] lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <Brand subtitle={subtitle} />
          <span className="flex h-11 items-center rounded-[10px] border border-white/20 px-3 text-sm font-bold text-[color:var(--side-strong)]">
            <span className="group-open:hidden">Menu</span>
            <span className="hidden group-open:inline">Close</span>
          </span>
        </summary>
        <nav aria-label="Main" className="flex max-h-[75vh] flex-col overflow-y-auto px-3 pb-4">
          <SideNav items={nav} home={home} />
          <Footer userName={userName} />
        </nav>
      </details>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col gap-6 overflow-y-auto border-r border-[color:var(--side-border)] bg-[color:var(--side-bg)] px-4 py-6 lg:flex">
        <div className="px-1.5">
          <Brand subtitle={subtitle} />
        </div>
        <nav aria-label="Main" className="flex flex-1 flex-col">
          <SideNav items={nav} home={home} />
          <Footer userName={userName} />
        </nav>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-5">
          <PasswordReminder userId={userId} />
          {children}
        </div>
      </main>
    </div>
  );
}
