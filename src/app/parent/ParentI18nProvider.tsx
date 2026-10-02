"use client";

import { I18nProvider } from "@/lib/i18n/context";

/** Wraps parent pages with the i18n context provider. */
export function ParentI18nProvider({ children }: { children: React.ReactNode }) {
  return <I18nProvider>{children}</I18nProvider>;
}
