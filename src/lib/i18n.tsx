import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { en } from "@/locales/en";
import { tr } from "@/locales/tr";

export type Locale = "en" | "tr";
export type Dict = typeof en;

const dictionaries: Record<Locale, Dict> = { en, tr };

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dict;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "rumicarts.locale";

function detectLocale(): Locale {
  // SSR: always default to "en" to avoid hydration mismatch
  if (typeof window === "undefined") return "en";

  // URL override: ?lang=tr or ?lang=en wins (useful for sharing & QA)
  try {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get("lang");
    if (urlLang === "en" || urlLang === "tr") return urlLang;
  } catch {
    // URL parsing failed — fall through
  }

  // Client: prefer saved choice, fall back to browser language
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "tr") return saved;
  } catch {
    // localStorage may be unavailable (private mode, etc.) — fall through
  }

  const lang = (navigator.language || "en").toLowerCase();
  if (lang.startsWith("tr")) return "tr";
  return "en";
}

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  /**
   * Optional override for the initial locale. When the SSR/SSG layer can read
   * the request URL it should pass `?lang=` here so the very first HTML render
   * is in the correct language; this is the only way the static snapshots are
   * actually localized (otherwise client hydration is too late for prerendered
   * content).
   */
  initialLocale?: Locale;
}) {
  const fallback: Locale = (() => {
    if (initialLocale) return initialLocale;
    if (typeof window !== "undefined") {
      const fromUrl = new URLSearchParams(window.location.search).get("lang");
      if (fromUrl === "tr" || fromUrl === "en") return fromUrl;
    }
    return "en";
  })();

  const [locale, setLocaleState] = useState<Locale>(fallback);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Priority on hydrate: explicit ?lang= URL override, then localStorage,
    // then browser language. (URL wins because it's the most explicit signal.)
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (fromUrl === "tr" || fromUrl === "en") {
      if (fromUrl !== locale) setLocaleState(fromUrl);
    } else {
      const detected = detectLocale();
      if (detected !== locale) setLocaleState(detected);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // ignore
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale, hydrated]);

  const setLocale = (l: Locale) => setLocaleState(l);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: dictionaries[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function useT() {
  return useI18n().t;
}
