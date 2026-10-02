"use client";

import { useI18n } from "@/lib/i18n/context";
import { LANGUAGES, LANGUAGE_LABELS, type Lang } from "@/lib/i18n/translations";

/** A compact language picker shown in the parent header. */
export function LanguageSelector() {
  const { lang, setLang } = useI18n();

  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value as Lang)}
      aria-label="Select language"
      className="h-11 rounded-full bg-brand-800 px-2.5 text-[13px] font-bold text-white outline-none hover:bg-brand-700 focus:ring-2 focus:ring-gold"
      style={{ WebkitAppearance: "none", appearance: "none", backgroundImage: "none" }}
    >
      {LANGUAGES.map((l) => (
        <option key={l} value={l}>
          {LANGUAGE_LABELS[l]}
        </option>
      ))}
    </select>
  );
}
