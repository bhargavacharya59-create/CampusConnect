"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { Logo } from "@/components/Logo";
import { BellIcon, SparkleIcon, UserIcon } from "@/components/icons";
import { LanguageSelector } from "./LanguageSelector";
import { COLLEGE_NAME } from "@/lib/constants";

interface ParentHeaderProps {
  unread: number;
  child: {
    parentId: string;
    className: string;
    semester: number;
    userName: string;
  } | null;
}

export function ParentHeader({ unread, child }: ParentHeaderProps) {
  const { t } = useI18n();

  return (
    <header className="bg-brand-900 px-5 pb-14 pt-5 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Logo size={34} />
          <span className="text-[15px] font-extrabold">{COLLEGE_NAME}</span>
        </div>
        <div className="no-print flex items-center gap-2">
          <LanguageSelector />
          <Link
            href="/parent/messages"
            aria-label={unread ? `${t("messages")}, ${unread} unread` : t("messages")}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-brand-800 hover:bg-brand-700"
          >
            <BellIcon size={20} />
            {unread > 0 && <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-gold ring-2 ring-brand-800" />}
          </Link>
          <Link href="/parent/assistant" aria-label={t("askAiAbout", { name: "" })} className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-800 text-gold hover:bg-brand-700">
            <SparkleIcon size={20} />
          </Link>
          <Link href="/parent/account" aria-label={t("studentDetails")} className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-800 hover:bg-brand-700">
            <UserIcon size={20} />
          </Link>
        </div>
      </div>
      {child && (
        <div className="mt-4">
          <div className="text-[13px] text-brand-200">{t("parentOf")}</div>
          <div className="text-2xl font-extrabold">{child.userName}</div>
          <div className="mt-0.5 font-mono text-xs text-brand-200">
            {child.parentId} · {child.className} · Sem {child.semester}
          </div>
        </div>
      )}
    </header>
  );
}
