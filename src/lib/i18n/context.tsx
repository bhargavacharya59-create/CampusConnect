"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_LANG, LANGUAGES, TRANSLATIONS, type Lang, type TranslationKey } from "./translations";
import { LANG_COOKIE } from "./lang";

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * The chosen language is kept in a cookie (not only localStorage) so the
 * server renders pages, AI answers and AI summaries in the same language
 * and there is no flash of English when a page loads.
 */
export function I18nProvider({ children, initialLang = DEFAULT_LANG }: { children: ReactNode; initialLang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(LANGUAGES.includes(initialLang) ? initialLang : DEFAULT_LANG);
  const router = useRouter();

  const setLang = useCallback(
    (l: Lang) => {
      if (!LANGUAGES.includes(l)) return;
      setLangState(l);
      try {
        document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
      } catch {
        /* cookies blocked: the choice still applies for this visit */
      }
      // Re-render server parts (e.g. the AI summary) in the new language.
      router.refresh();
    },
    [router],
  );

  const translate = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>): string => {
      let str = TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.split(`{${k}}`).join(String(v));
        }
      }
      return str;
    },
    [lang],
  );

  return <I18nContext.Provider value={{ lang, setLang, t: translate }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
