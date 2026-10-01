"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
  /** Pending count shown as a badge. */
  count?: number;
}

/** Sidebar links; highlights the current section. `home` matches only exactly. */
export function SideNav({ items, home }: { items: NavItem[]; home: string }) {
  const path = usePathname();
  return (
    <ul className="flex flex-col gap-1">
      {items.map((it) => {
        const active = it.href === home ? path === home : path === it.href || path.startsWith(it.href + "/");
        return (
          <li key={it.href}>
            <Link
              href={it.href}
              aria-current={active ? "page" : undefined}
              onClick={(e) => (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open")}
              className={`flex h-11 items-center justify-between gap-2 rounded-[10px] px-3.5 text-sm font-semibold transition-colors ${
                active ? "bg-[color:var(--side-active-bg)] text-[color:var(--side-active-text)]" : "text-[color:var(--side-text)] hover:text-[color:var(--side-strong)]"
              }`}
            >
              <span>{it.label}</span>
              {!!it.count && (
                <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-[color:var(--count-bg)] px-1.5 text-xs font-extrabold text-[color:var(--count-text)]">
                  {it.count}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
