import { useI18n } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="hidden sm:flex items-center text-xs tracking-[0.2em] uppercase text-muted-foreground">
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`px-1.5 py-1 transition hover:text-foreground ${
          locale === "en" ? "text-foreground" : ""
        }`}
        aria-pressed={locale === "en"}
        aria-label="English"
      >
        EN
      </button>
      <span aria-hidden className="opacity-30 px-0.5">/</span>
      <button
        type="button"
        onClick={() => setLocale("tr")}
        className={`px-1.5 py-1 transition hover:text-foreground ${
          locale === "tr" ? "text-foreground" : ""
        }`}
        aria-pressed={locale === "tr"}
        aria-label="Türkçe"
      >
        TR
      </button>
    </div>
  );
}
