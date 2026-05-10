import { createFileRoute } from "@tanstack/react-router";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/shipping")({
  component: ShippingPage,
  head: () => ({
    meta: [
      { title: "Shipping Policy — Rumicarts" },
      { name: "description", content: "How Rumicarts ships worldwide — lead times, carriers, and customs." },
    ],
  }),
});

function ShippingPage() {
  const t = useT();
  return (
    <LegalPageLayout
      eyebrow={t.shipping.eyebrow}
      title={t.shipping.title}
      lastUpdated={t.legalPages.lastUpdated("May 2026")}
    >
      <p className="text-lg text-foreground/90 leading-relaxed">{t.shipping.intro}</p>
      {t.shipping.sections.map((s) => (
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
