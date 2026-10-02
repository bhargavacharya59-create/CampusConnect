"use client";

import { I18nProvider } from "@/lib/i18n/context";
import type { Lang } from "@/lib/i18n/translations";

/** Wraps parent pages with the i18n context provider. */
export function ParentI18nProvider({ children, initialLang }: { children: React.ReactNode; initialLang: Lang }) {
  return <I18nProvider initialLang={initialLang}>{children}</I18nProvider>;
}
