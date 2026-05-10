import { createFileRoute } from "@tanstack/react-router";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — Rumicarts" },
      { name: "description", content: "How Rumicarts collects, uses, and protects your information." },
    ],
  }),
});

function PrivacyPage() {
  const t = useT();
  return (
    <LegalPageLayout
      eyebrow={t.privacy.eyebrow}
      title={t.privacy.title}
      lastUpdated={t.legalPages.lastUpdated("May 2026")}
    >
      <p className="text-lg text-foreground/90 leading-relaxed">{t.privacy.intro}</p>
      {t.privacy.sections.map((s) => (
        <section key={s.heading}>
          <h2 className="text-xl font-medium text-foreground mt-10 mb-3 tracking-tight">
            {s.heading}
          </h2>
          <p>{s.body}</p>
        </section>
      ))}
    </LegalPageLayout>
  );
}
