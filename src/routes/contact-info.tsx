import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/contact-info")({
  component: ContactInfoPage,
  head: () => ({
    meta: [
      { title: "Rumicarts — Contact Information" },
      { name: "description", content: "How to reach Rumicarts." },
    ],
  }),
});

function ContactInfoPage() {
  const t = useT();
  return (
    <LegalPageLayout
      eyebrow={t.contactInfo.eyebrow}
      title={t.contactInfo.title}
    >
      <p className="text-lg text-foreground/90 leading-relaxed">{t.contactInfo.intro}</p>
      {t.contactInfo.sections.map((s) => (
        <section key={s.heading}>
          <h2 className="text-xl font-medium text-foreground mt-10 mb-3 tracking-tight">
            {s.heading}
          </h2>
          <p>{s.body}</p>
        </section>
      ))}
      <div className="mt-12 pt-8 border-t border-border text-center">
        <Link
          to="/"
          hash="contact"
          className="inline-block text-sm tracking-[0.25em] uppercase border-b border-foreground pb-1 hover:opacity-60 transition text-foreground"
        >
          {t.contact.form.submit} →
        </Link>
      </div>
    </LegalPageLayout>
  );
}
