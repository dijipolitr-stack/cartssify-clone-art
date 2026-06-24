import { createFileRoute } from "@tanstack/react-router";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/refund")({
  component: RefundPage,
  head: () => ({
    meta: [
      { title: "Rumicarts — Refund Policy" },
      { name: "description", content: "Our refund policy for custom-built carts." },
    ],
  }),
});

function RefundPage() {
  const t = useT();
  return (
    <LegalPageLayout
      eyebrow={t.refund.eyebrow}
      title={t.refund.title}
      lastUpdated={t.legalPages.lastUpdated("May 2026")}
    >
      <p className="text-lg text-foreground/90 leading-relaxed">{t.refund.intro}</p>
      {t.refund.sections.map((s) => (
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
