import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { TopBar } from "@/components/TopBar";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { CustomizeDialog } from "@/components/CustomizeDialog";
import { getProduct, localizeProduct } from "@/data/products";
import { useI18n } from "@/lib/i18n";
import type { Locale } from "@/data/configurator";

export const Route = createFileRoute("/")({
  component: Index,
  // "Hemen Tasarla" her yerden → /?tasarla=1 ile Özelleştir dialog'unu açar.
  // Anahtar opsiyonel → "/"'a giden diğer Link'ler (logo, menü) search vermeden bağlanır.
  validateSearch: (s: Record<string, unknown>): { tasarla?: true } =>
    s.tasarla !== undefined && s.tasarla !== false && s.tasarla !== "false"
      ? { tasarla: true }
      : {},
  head: () => ({
    meta: [
      { title: "Rumicarts — Markana Özel Mobil Tezgah" },
      {
        name: "description",
        content:
          "Etkinlik ve perakende için markana özel, taşınabilir mobil tezgah. Modeli seç, rengini ve aksesuarlarını özelleştir, teklifini al.",
      },
    ],
  }),
});

// Marka paleti (menü + örnekler sayfasıyla aynı).
const C = {
  bg: "#F7F6F2",
  bg2: "#ECE7DD",
  ink: "#1E1E1E",
  ink2: "#5F5F5A",
  gold: "#B89B5E",
  blue: "#BFD8EA",
  border: "#E6E3DD",
};

// İki dilli içerik (marka PPTX sunumundan).
const CONTENT: Record<Locale, {
  heroEyebrow: string;
  heroTitle: ReactNode;
  heroLead: string;
  designNow: string;
  browseExamples: string;
  stepsEyebrow: string;
  stepsTitle: string;
  stepsSub: string;
  steps: { h: string; p: string }[];
  splitEyebrow: string;
  splitTitle: string;
  splitP1: string;
  splitP2: string;
  casesEyebrow: string;
  casesTitle: string;
  casesSub: string;
  cases: { h: string; p: string }[];
  bandEyebrow: string;
  bandTitle: string;
  bandP: string;
}> = {
  tr: {
    heroEyebrow: "Markana Özel Mobil Tezgah",
    heroTitle: (
      <>
        Arabanı
        <br />
        Tasarla
      </>
    ),
    heroLead:
      "Markan benzersizdir; etkinlik ve satış araban da öyle olmalı. Modeli seç; tezgah türünü, gövde rengini, tente rengini, metal detaylarını, aksesuarları ve logoyu özelleştir. Tasarımını kaydet, teklif al ve sipariş ver.",
    designNow: "Hemen Tasarla",
    browseExamples: "Örnekleri İncele",
    stepsEyebrow: "Nasıl Çalışır",
    stepsTitle: "3 adımda arabanı tasarla",
    stepsSub: "Sıfırdan başlamana gerek yok — hazır modelin üzerinde markanı kur.",
    steps: [
      { h: "Modelini Seç", p: "Rumicarts ana model seçeneklerinden sana en uygun olanı seç." },
      { h: "Renk ve Aksesuarları Seç", p: "Gövde, tente ve metal renklerini; aksesuarları, tezgahı ve logoyu özelleştir." },
      { h: "Kaydet ve Sipariş Ver", p: "Tasarımını kaydet, teklifini al ve siparişini kolayca oluştur." },
    ],
    splitEyebrow: "Neden Rumicarts",
    splitTitle: "Markanız için taşınabilir bir sahne",
    splitP1:
      "Etkinliklerde, otel lobilerinde, AVM koridorlarında, fuar alanlarında veya özel davetlerde markanızı güçlü bir şekilde görünür kılar.",
    splitP2:
      "Her detay; gövde rengi, tente, metal aksam, logo uygulaması ve kullanım senaryosuna göre özelleştirilebilir.",
    casesEyebrow: "Kullanım Alanları",
    casesTitle: "Her alanı zarif bir satış noktasına dönüştürün",
    casesSub: "Etkinlik, otel, AVM ve perakende alanları için markanıza özel mobil tezgah çözümleri.",
    cases: [
      { h: "Etkinlik", p: "Fuar, lansman ve özel davetlerde markanı öne çıkar." },
      { h: "Otel", p: "Lobi ve teras alanlarında zarif bir servis noktası." },
      { h: "AVM", p: "Koridorlarda dikkat çeken mobil satış standı." },
      { h: "Perakende", p: "Mağaza içi vitrin ve pop-up satış deneyimi." },
    ],
    bandEyebrow: "Hazır mısın?",
    bandTitle: "Aracını tasarla, teklifini al",
    bandP: "Birkaç dakikada markana özel aracını oluştur; ekibimiz teklifinle sana dönsün.",
  },
  en: {
    heroEyebrow: "Custom Mobile Cart for Your Brand",
    heroTitle: (
      <>
        Design
        <br />
        Your Cart
      </>
    ),
    heroLead:
      "Your brand is unique; your event and sales cart should be too. Choose a model; customize the cart type, body color, awning color, metal details, accessories and logo. Save your design, get a quote and order.",
    designNow: "Design Now",
    browseExamples: "Browse Examples",
    stepsEyebrow: "How It Works",
    stepsTitle: "Design your cart in 3 steps",
    stepsSub: "No need to start from scratch — build your brand on a ready model.",
    steps: [
      { h: "Choose Your Model", p: "Pick the Rumicarts base model that suits you best." },
      { h: "Pick Colors & Accessories", p: "Customize body, awning and metal colors; accessories, shelf and logo." },
      { h: "Save & Request a Quote", p: "Save your design, get your quote and place your order easily." },
    ],
    splitEyebrow: "Why Rumicarts",
    splitTitle: "A portable stage for your brand",
    splitP1:
      "At events, hotel lobbies, mall corridors, fair grounds or private gatherings, it makes your brand powerfully visible.",
    splitP2:
      "Every detail — body color, awning, metal parts, logo application — can be tailored to your use case.",
    casesEyebrow: "Use Cases",
    casesTitle: "Turn any space into an elegant point of sale",
    casesSub: "Custom mobile cart solutions for events, hotels, malls and retail spaces.",
    cases: [
      { h: "Events", p: "Stand out at fairs, launches and private gatherings." },
      { h: "Hotels", p: "An elegant service point in lobbies and terraces." },
      { h: "Malls", p: "An eye-catching mobile stand in corridors." },
      { h: "Retail", p: "In-store display and pop-up sales experience." },
    ],
    bandEyebrow: "Ready?",
    bandTitle: "Design your cart, get your quote",
    bandP: "Build your brand's custom cart in minutes; our team gets back with your quote.",
  },
};

function Eyebrow({ children, color = C.gold }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="text-xs font-semibold uppercase"
      style={{ letterSpacing: "0.28em", color }}
    >
      {children}
    </span>
  );
}

function Index() {
  const { locale } = useI18n();
  const c = CONTENT[locale];
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [customizeOpen, setCustomizeOpen] = useState(false);
  // "Hemen Tasarla" CTA'ları konfigüratörü ilk konfigüre edilebilir ürünle açar.
  const flagship = getProduct("kart-100-mat-lam");
  const flagshipLocalized = flagship ? localizeProduct(flagship, locale) : null;
  const openDesign = () => setCustomizeOpen(true);

  // Menüden/başka sayfadan ?tasarla=1 ile gelindiyse dialog'u otomatik aç.
  useEffect(() => {
    if (search.tasarla) setCustomizeOpen(true);
  }, [search.tasarla]);

  // Dialog kapanınca URL'deki tasarla parametresini temizle (tekrar tetiklenebilsin).
  const handleOpenChange = (o: boolean) => {
    setCustomizeOpen(o);
    if (!o && search.tasarla) navigate({ to: "/", search: {} });
  };

  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.ink }}>
      <TopBar />
      <SiteNav variant="home" />

      <main>
        {/* ---- HERO ---- */}
        <section className="relative flex items-center overflow-hidden" style={{ minHeight: "86vh" }}>
          <img
            src="/home/hero-arch.png"
            alt="Rumicarts"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
          <div
            className="absolute inset-0 z-10 hidden md:block"
            style={{
              background:
                "linear-gradient(90deg, rgba(247,246,242,.94) 0%, rgba(247,246,242,.72) 34%, rgba(247,246,242,0) 62%)",
            }}
          />
          <div
            className="absolute inset-0 z-10 md:hidden"
            style={{
              background:
                "linear-gradient(180deg, rgba(247,246,242,.55) 0%, rgba(247,246,242,.93) 100%)",
            }}
          />
          <div className="relative z-20 w-full max-w-[1200px] mx-auto px-6">
            <div className="max-w-xl">
              <Eyebrow>{c.heroEyebrow}</Eyebrow>
              <h1
                className="font-light mt-4 mb-5"
                style={{ fontSize: "clamp(40px,6vw,74px)", lineHeight: 1.05, letterSpacing: "-0.01em" }}
              >
                {c.heroTitle}
              </h1>
              <p className="text-[17px] mb-8 max-w-[480px]" style={{ color: C.ink2 }}>
                {c.heroLead}
              </p>
              <div className="flex flex-wrap gap-3.5">
                <button type="button" onClick={openDesign} className="btn-solid">
                  {c.designNow}
                </button>
                <Link to="/products" search={{}} className="btn-outline">
                  {c.browseExamples}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ---- 3 ADIM ---- */}
        <section className="py-20 md:py-24" id="adimlar">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <Eyebrow>{c.stepsEyebrow}</Eyebrow>
              <h2 className="font-light mt-3 mb-3" style={{ fontSize: "clamp(30px,4vw,46px)", lineHeight: 1.08 }}>
                {c.stepsTitle}
              </h2>
              <p style={{ color: C.ink2 }}>{c.stepsSub}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-7">
              {c.steps.map((s, i) => (
                <div
                  key={i}
                  className="rounded-md p-9 transition duration-300 hover:-translate-y-1.5"
                  style={{ background: "#fff", border: `1px solid ${C.border}` }}
                >
                  <div
                    className="w-13 h-13 rounded-full flex items-center justify-center text-xl font-semibold mb-6"
                    style={{ width: 52, height: 52, background: C.bg2, color: C.gold }}
                  >
                    {i + 1}
                  </div>
                  <h3 className="text-xl font-normal mb-3">{s.h}</h3>
                  <p className="text-[15px]" style={{ color: C.ink2 }}>
                    {s.p}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---- TAŞINABİLİR SAHNE (split) ---- */}
        <section style={{ background: C.bg2 }} id="neden">
          <div className="grid md:grid-cols-2 items-center">
            <div className="px-6 md:px-[6vw] py-16 md:py-24">
              <Eyebrow>{c.splitEyebrow}</Eyebrow>
              <h2 className="font-light mt-3 mb-5" style={{ fontSize: "clamp(28px,3.4vw,44px)", lineHeight: 1.08 }}>
                {c.splitTitle}
              </h2>
              <p className="mb-3.5" style={{ color: C.ink2 }}>{c.splitP1}</p>
              <p style={{ color: C.ink2 }}>{c.splitP2}</p>
              <button type="button" onClick={openDesign} className="btn-solid mt-8">
                {c.designNow}
              </button>
            </div>
            <div style={{ background: C.blue, minHeight: 340 }} className="h-full">
              <img
                src="/home/lifestyle-mall.png"
                alt={c.splitTitle}
                loading="lazy"
                className="w-full h-full object-cover"
                style={{ minHeight: 340 }}
              />
            </div>
          </div>
        </section>

        {/* ---- KULLANIM ALANLARI ---- */}
        <section className="py-20 md:py-24" id="kullanim">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <Eyebrow>{c.casesEyebrow}</Eyebrow>
              <h2 className="font-light mt-3 mb-3" style={{ fontSize: "clamp(28px,3.6vw,44px)", lineHeight: 1.08 }}>
                {c.casesTitle}
              </h2>
              <p style={{ color: C.ink2 }}>{c.casesSub}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {c.cases.map((cs, i) => (
                <div key={i} className="rounded-md p-8" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
                  <div className="w-3 h-3 rounded-full mb-5" style={{ background: C.gold }} />
                  <h3 className="text-lg font-normal mb-2">{cs.h}</h3>
                  <p className="text-sm" style={{ color: C.ink2 }}>{cs.p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---- CTA BANDI ---- */}
        <section className="text-center px-6 py-20 md:py-24" style={{ background: C.ink, color: "#fff" }}>
          <Eyebrow color={C.gold}>{c.bandEyebrow}</Eyebrow>
          <h2 className="font-light mt-3 mb-4" style={{ fontSize: "clamp(28px,3.6vw,46px)", lineHeight: 1.08 }}>
            {c.bandTitle}
          </h2>
          <p className="max-w-lg mx-auto mb-8" style={{ color: "rgba(255,255,255,.72)" }}>
            {c.bandP}
          </p>
          <button type="button" onClick={openDesign} className="btn-ghost">
            {c.designNow}
          </button>
        </section>
      </main>

      <SiteFooter />

      {flagshipLocalized && (
        <CustomizeDialog product={flagshipLocalized} open={customizeOpen} onOpenChange={handleOpenChange} />
      )}

      {/* Buton stilleri — marka paleti (tek yerde, sınıflarla) */}
      <style>{`
        .btn-solid,.btn-outline,.btn-ghost{
          display:inline-flex;align-items:center;justify-content:center;
          padding:13px 28px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;
          border-radius:2px;border:1px solid transparent;cursor:pointer;transition:.25s;
        }
        .btn-solid{background:${C.gold};color:#fff}
        .btn-solid:hover{background:#a2884d}
        .btn-outline{border-color:${C.ink};color:${C.ink};background:transparent}
        .btn-outline:hover{background:${C.ink};color:#fff}
        .btn-ghost{border-color:rgba(255,255,255,.85);color:#fff;background:transparent}
        .btn-ghost:hover{background:#fff;color:${C.ink}}
      `}</style>
    </div>
  );
}
