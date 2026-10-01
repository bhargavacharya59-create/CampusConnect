"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CardIcon, ChartIcon, ChatIcon, CheckSquareIcon, HomeIcon } from "@/components/icons";

const TABS = [
  { href: "/parent", label: "Home", Icon: HomeIcon },
  { href: "/parent/attendance", label: "Attendance", Icon: CheckSquareIcon },
  { href: "/parent/marks", label: "Marks", Icon: ChartIcon },
  { href: "/parent/fees", label: "Fees", Icon: CardIcon },
  { href: "/parent/messages", label: "Messages", Icon: ChatIcon },
];

export function BottomNav({ unread }: { unread: number }) {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="no-print sticky bottom-0 z-10 flex h-[70px] justify-around border-t border-line bg-white px-1 pb-[env(safe-area-inset-bottom)]">
      {TABS.map(({ href, label, Icon }) => {
        const active = href === "/parent" ? path === "/parent" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`relative flex min-w-[60px] flex-col items-center justify-center gap-1 text-[11px] font-bold ${active ? "text-brand-600" : "text-ink-muted hover:text-ink"}`}
          >
            <Icon />
            {label}
            {label === "Messages" && unread > 0 && (
              <span className="absolute right-2.5 top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-alert-600 px-1 text-[10px] font-extrabold text-white">
                {unread}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
