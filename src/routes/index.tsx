import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import heroImg from "@/assets/hero-cart.jpg";
import customImg from "@/assets/cart-custom.jpg";
import portableImg from "@/assets/cart-portable.jpg";
import rainbowImg from "@/assets/cart-rainbow.jpg";
import { TopBar } from "@/components/TopBar";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { AboutSection } from "@/components/AboutSection";
import { TrustSection } from "@/components/TrustSection";
import { ContactSection } from "@/components/ContactSection";
import { UseCasesSection } from "@/components/UseCasesSection";
import { CustomizeDialog } from "@/components/CustomizeDialog";
import { getProduct, localizeProduct } from "@/data/products";
import { useI18n, useT } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Rumicarts — Mobile Cart Solutions for Events & Retail" },
      {
        name: "description",
        content:
          "Mobile carts solutions for events and retail. Custom, portable display carts built to your brand.",
      },
    ],
  }),
});

function Hero() {
  const t = useT();
  return (
    <section className="relative w-full h-[88vh] min-h-[600px] overflow-hidden">
      <video
        src="/hero-cart.mp4"
        poster={heroImg}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/40" />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 text-white">
        <div className="border border-white/80 px-10 md:px-20 py-10 md:py-14 max-w-3xl">
          <h1 className="text-4xl md:text-7xl font-light tracking-[0.15em]">
            RUMI<span className="opacity-70">CARTS</span>
          </h1>
          <div className="h-px w-24 bg-white/70 mx-auto my-6" />
          <p className="text-xs md:text-sm tracking-[0.35em] uppercase">
            {t.hero.tagline}
          </p>
        </div>
        <a
          href="#features"
          className="mt-10 inline-block bg-white text-foreground px-8 py-3 text-sm tracking-[0.2em] uppercase hover:bg-white/90 transition"
        >
          {t.hero.cta}
        </a>
      </div>
    </section>
  );
}

type FeatureProps = {
  image: string;
  eyebrow: string;
  title: string;
  body: string;
  cta?: string;
  /**
   * Where to send the user when they click the CTA. If a callback is provided,
   * the CTA renders as a button (used for the Customize feature → opens the
   * Customize dialog). Falls back to the in-page contact anchor.
   */
  ctaHref?: string;
  onCtaClick?: () => void;
  reverse?: boolean;
};

function Feature({
  image,
  eyebrow,
  title,
  body,
  cta,
  ctaHref = "#contact",
  onCtaClick,
  reverse,
}: FeatureProps) {
  return (
    <section className="py-20 md:py-32 border-t border-border">
      <div
        className={`max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 md:gap-20 items-center ${
          reverse ? "md:[&>div:first-child]:order-2" : ""
        }`}
      >
        <div className="aspect-[4/3] overflow-hidden bg-secondary">
          <img
            src={image}
            alt={title}
            loading="lazy"
            width={1600}
            height={1200}
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.03]"
          />
        </div>
        <div className="max-w-md">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-5">
            {eyebrow}
          </p>
          <h2 className="text-3xl md:text-5xl font-light tracking-tight text-foreground leading-[1.05]">
            {title}
          </h2>
          <p className="mt-6 text-base text-muted-foreground leading-relaxed">
            {body}
          </p>
          {cta &&
            (onCtaClick ? (
              <button
                onClick={onCtaClick}
                className="mt-8 inline-block text-sm tracking-[0.2em] uppercase border-b border-foreground pb-1 hover:opacity-60 transition cursor-pointer"
              >
                {cta}
              </button>
            ) : (
              <a
                href={ctaHref}
                className="mt-8 inline-block text-sm tracking-[0.2em] uppercase border-b border-foreground pb-1 hover:opacity-60 transition"
              >
                {cta}
              </a>
            ))}
        </div>
      </div>
    </section>
  );
}

function ColorBanner() {
  const { locale } = useI18n();
  const eyebrow = locale === "tr" ? "RENK SEÇENEKLERİ" : "COLOR OPTIONS";
  const title =
    locale === "tr" ? "Markana göre, her renkte" : "Any color, built to your brand";
  const body =
    locale === "tr"
      ? "Gövde ve tente rengini seç, aracını markana göre özelleştir."
      : "Choose body and awning color and tailor your cart to your brand.";
  return (
    <section className="py-16 md:py-24 border-t border-border bg-white">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-5">
          {eyebrow}
        </p>
        <h2 className="text-3xl md:text-5xl font-light tracking-tight text-foreground leading-[1.05]">
          {title}
        </h2>
        <p className="mt-5 text-base text-muted-foreground max-w-xl mx-auto">
          {body}
        </p>
        <img
          src="/products/anasayfa-4arac.webp"
          alt={title}
          loading="lazy"
          width={1024}
          height={538}
          className="mt-10 w-full max-w-5xl mx-auto object-contain"
        />
      </div>
    </section>
  );
}

function Index() {
  const t = useT();
  const { locale } = useI18n();
  const [customizeOpen, setCustomizeOpen] = useState(false);
  // Homepage "Customize" CTA, configuratoru ilk konfigüre edilebilir ürünle açar.
  // Localized so the dialog opens with TR strings when browsing in Turkish.
  const flagship = getProduct("kart-100-mat-lam");
  const flagshipLocalized = flagship ? localizeProduct(flagship, locale) : null;

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <SiteNav variant="home" />
      <main>
        <Hero />
        <ColorBanner />
        {/* The 3 feature blocks live under a #features anchor so the nav link works */}
        <div id="features">
          <Feature
            image={customImg}
            eyebrow={t.features.customize.eyebrow}
            title={t.features.customize.title}
            body={t.features.customize.body}
            cta={t.features.customize.cta}
            onCtaClick={
              flagshipLocalized ? () => setCustomizeOpen(true) : undefined
            }
          />
          <Feature
            image={portableImg}
            eyebrow={t.features.portable.eyebrow}
            title={t.features.portable.title}
            body={t.features.portable.body}
            cta={t.features.portable.cta}
            reverse
          />
          <Feature
            image={rainbowImg}
            eyebrow={t.features.iconic.eyebrow}
            title={t.features.iconic.title}
            body={t.features.iconic.body}
            cta={t.features.iconic.cta}
          />
        </div>
        <UseCasesSection />
        <AboutSection />
        <TrustSection />
        <ContactSection />
      </main>
      <SiteFooter />
      {flagshipLocalized && (
        <CustomizeDialog
          product={flagshipLocalized}
          open={customizeOpen}
          onOpenChange={setCustomizeOpen}
        />
      )}
    </div>
  );
}
