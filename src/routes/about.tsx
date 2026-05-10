import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import aboutImg from "@/assets/lifestyle/about-cafe-setup.png";
import workshopImg from "@/assets/lifestyle/use-case-coffee-popup.png";
import retailImg from "@/assets/lifestyle/use-case-retail-display.png";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About — Rumicarts" },
      {
        name: "description",
        content:
          "Rumicarts — a small Istanbul workshop building hand-made mobile display carts for events and retail worldwide.",
      },
    ],
  }),
});

const SECTION_IMAGES = [aboutImg, workshopImg, retailImg];

function AboutPage() {
  const t = useT();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      <SiteNav variant="products-list" />
      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-16 md:pt-24 pb-12 md:pb-20 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-5">
            {t.aboutPage.eyebrow}
          </p>
          <h1 className="text-4xl md:text-6xl font-light tracking-tight leading-[1.05]">
            {t.aboutPage.title}
          </h1>
          <p className="mt-8 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t.aboutPage.intro}
          </p>
        </section>

        {/* Big lead image */}
        <section className="max-w-6xl mx-auto px-6 mb-20 md:mb-32">
          <div className="aspect-[16/9] overflow-hidden bg-secondary">
            <img
              src={aboutImg}
              alt={t.aboutPage.title}
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        </section>

        {/* Sections — alternate text/image */}
        <div className="max-w-5xl mx-auto px-6 space-y-20 md:space-y-32 pb-20 md:pb-32">
          {t.aboutPage.sections.map((section, idx) => {
            const reverse = idx % 2 === 1;
            const sectionImage = SECTION_IMAGES[idx % SECTION_IMAGES.length];
            return (
              <article
                key={section.heading}
                className={`grid md:grid-cols-2 gap-10 md:gap-16 items-center ${
                  reverse ? "md:[&>div:first-child]:order-2" : ""
                }`}
              >
                <div className="aspect-[4/3] overflow-hidden bg-secondary">
                  <img
                    src={sectionImage}
                    alt={section.heading}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-light tracking-tight leading-snug">
                    {section.heading}
                  </h2>
                  <p className="mt-5 text-base text-muted-foreground leading-relaxed">
                    {section.body}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        {/* CTA */}
        <section className="border-t border-border py-20 md:py-32 text-center px-6">
          <Link
            to="/"
            hash="contact"
            className="inline-block bg-foreground text-background px-10 py-4 text-sm tracking-[0.25em] uppercase hover:opacity-90 transition"
          >
            {t.aboutPage.cta}
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
