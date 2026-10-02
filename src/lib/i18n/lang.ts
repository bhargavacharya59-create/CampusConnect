// Shared by server and client code (no React, no next/headers here).
import { DEFAULT_LANG, LANGUAGES, type Lang } from "./translations";

export const LANG_COOKIE = "cc-lang";

export function parseLang(v: string | null | undefined): Lang {
  return v && (LANGUAGES as readonly string[]).includes(v) ? (v as Lang) : DEFAULT_LANG;
}

/** Full language name used in AI instructions. */
export const LANG_FOR_AI: Record<Lang, string> = {
  en: "English",
  kn: "Kannada (ಕನ್ನಡ script)",
  hi: "Hindi (हिन्दी, Devanagari script)",
};

/** Weekly AI summaries are cached per language: PARENT_WEEKLY (English), PARENT_WEEKLY_KN, PARENT_WEEKLY_HI. */
export function summaryKind(lang: Lang): string {
  return lang === "en" ? "PARENT_WEEKLY" : `PARENT_WEEKLY_${lang.toUpperCase()}`;
}
