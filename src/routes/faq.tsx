import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/faq")({
  component: FaqPage,
  head: () => ({
    meta: [
      { title: "FAQ — Rumicarts" },
      {
        name: "description",
        content:
          "Frequently asked questions about ordering, customising, shipping, and using a Rumicarts cart.",
      },
    ],
  }),
});

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="border-b border-border">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-4 py-5 text-left group"
        aria-expanded={open}
      >
        <span className="text-base font-medium text-foreground leading-snug">
          {q}
        </span>
        <span
          className="flex-shrink-0 text-2xl text-muted-foreground group-hover:text-foreground transition leading-none w-6 text-center"
          aria-hidden
        >
          {open ? "−" : "+"}
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-96 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-sm text-muted-foreground leading-relaxed pr-10">{a}</p>
      </div>
    </article>
  );
}

function FaqPage() {
  const t = useT();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      <SiteNav variant="products-list" />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 md:py-24 w-full">
        <header className="mb-14 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4">
            {t.faq.eyebrow}
          </p>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight">
            {t.faq.title}
          </h1>
          <p className="mt-6 text-base text-muted-foreground max-w-xl mx-auto">
            {t.faq.intro}
          </p>
        </header>

        <div className="space-y-12">
          {t.faq.categories.map((cat) => (
            <section key={cat.title}>
              <h2 className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-2 pb-3 border-b border-foreground">
                {cat.title}
              </h2>
              <div>
                {cat.items.map((item) => (
                  <FaqItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 pt-10 border-t border-border text-center">
          <p className="text-sm text-muted-foreground mb-4">
            {/* deliberately not in dictionaries: a small bridge sentence is fine */}
          </p>
          <Link
            to="/"
            hash="contact"
            className="inline-block text-sm tracking-[0.25em] uppercase border-b border-foreground pb-1 hover:opacity-60 transition text-foreground"
          >
            {t.contact.eyebrow} →
          </Link>
        </div>
      </main>
      <SiteFooter topMargin />
    </div>
  );
}
