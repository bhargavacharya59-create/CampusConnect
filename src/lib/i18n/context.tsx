"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_LANG, TRANSLATIONS, type Lang, type TranslationKey } from "./translations";

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "cc-lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  // Hydrate from localStorage on first render
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && (stored === "en" || stored === "kn" || stored === "hi")) {
        setLangState(stored);
      }
    } catch { /* SSR or localStorage unavailable */ }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* noop */ }
  }, []);

  const translate = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>): string => {
      let str = TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }
      return str;
    },
    [lang],
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t: translate }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
