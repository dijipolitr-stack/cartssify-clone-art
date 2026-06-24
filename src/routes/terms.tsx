import { createFileRoute } from "@tanstack/react-router";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Rumicarts — Terms of Service" },
      { name: "description", content: "Terms that apply when you order from Rumicarts." },
    ],
  }),
});

function TermsPage() {
  const t = useT();
  return (
    <LegalPageLayout
      eyebrow={t.terms.eyebrow}
      title={t.terms.title}
      lastUpdated={t.legalPages.lastUpdated("May 2026")}
    >
      <p className="text-lg text-foreground/90 leading-relaxed">{t.terms.intro}</p>
      {t.terms.sections.map((s) => (
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
