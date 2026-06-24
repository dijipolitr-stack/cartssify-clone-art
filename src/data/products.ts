import { CONFIG_PRODUCTS, formatPrice } from "@/data/configurator";

export type Product = {
  slug: string;
  title: string;
  price: string;
  image: string;
  /** Yüzey: mat (düz) / lake (parlak vernik) — kartta CSS ile parlaklık farkı için. */
  finish?: "mat" | "lake";
  gallery?: string[];
  tagline?: string;
  description: string;
  features: string[];
  specs?: { label: string; value: string }[];
  /** "Coming Soon" rozetiyle gösterilir, sepete eklenmez. */
  comingSoon?: boolean;
  /** Vitrin (showcase) kartı hangi konfigüratör ürününü açar — boyut/yüzey ön-seçimi. */
  configSlug?: string;
  /** Türkçe alan çevirileri; locale `tr` iken bunlar render edilir. */
  tr?: {
    title?: string;
    tagline?: string;
    description?: string;
    features?: string[];
    specs?: { label: string; value: string }[];
  };
};

// --------------------------------------------------------------------------
// Katalog görselleri — GERÇEK V-Ray hero render'ları (7 açı).
// Render seti boyuta göre ayrılır: 150 cm ürünler AYRI 150 raflı setten
// (/renders/150/), 100 cm ürünler kök setten (/renders/) galeri gösterir.
// Konfigüratör önizlemesi de aynı mantıkla boyuta göre seçer (CustomizeDialog).
// --------------------------------------------------------------------------
const GALLERY_ANGLES = [
  "on-sag",
  "on-sol",
  "arka",
  "arka-sag",
  "arka-sol",
  "arka-kapak",
];
function renderBaseFor(size: "100cm" | "150cm"): string {
  return size === "150cm" ? "/renders/150" : "/renders";
}
function heroImageFor(size: "100cm" | "150cm"): string {
  return `${renderBaseFor(size)}/hero-on.webp`;
}
// Ürünler sayfası vitrini — her kart FARKLI bir varyant göstererek çeşitliliği sergiler:
// boyut (100/150), raf (raflı/rafsız), tente (var/yok), tekerlek (var/yok), renk
// (mat = beyaz/krem, lake = renkli). Tüm bu render setleri canlıda mevcut.
const KART_VITRIN: Record<string, string> = {
  "kart-100-mat-lam": "/renders/100-rafli/hero-on.webp", // 100 raflı, tenteli, tekerlekli, beyaz
  "kart-100-parlak-lake": "/renders/hero-mavi-on-tenteyok.webp", // 100 rafsız, tentesiz, mavi
  "kart-150-mat-lam": "/renders/150/hero-on-tekeryok.webp", // 150 raflı, tekerleksiz, beyaz
  "kart-150-parlak-lake": "/renders/150-rafsiz/hero-kirmizi-on.webp", // 150 rafsız, tenteli, kırmızı
};
function galleryFor(size: "100cm" | "150cm"): string[] {
  const base = renderBaseFor(size);
  return GALLERY_ANGLES.map((a) => `${base}/hero-${a}.webp`);
}

const baseFeatures = [
  "Tek araçta 7 kriterle özelleştir — gövde/tente/metal rengi, tekerlek, raf, arka kapak",
  "Logonu yükle, gövde ve tente yüzeylerine uygula",
  "Etkinlik, pop-up ve mobil perakende için taşınabilir tasarım",
];
const baseFeaturesEn = [
  "Customize with 7 criteria — body/awning/metal color, wheels, shelf, back cover",
  "Upload your logo and apply it to body and awning surfaces",
  "Portable design for events, pop-ups and mobile retail",
];

function specsFor(size: "100cm" | "150cm") {
  const len = size === "100cm" ? "100 cm" : "150 cm";
  return {
    en: [
      { label: "Length", value: len },
      { label: "Depth", value: "55 cm" },
      { label: "Height", value: "95 cm" },
    ],
    tr: [
      { label: "Uzunluk", value: len },
      { label: "Derinlik", value: "55 cm" },
      { label: "Yükseklik", value: "95 cm" },
    ],
  };
}

const DESC_EN =
  "A fully customizable mobile cart. Choose size and finish, then configure body, awning, wheels, shelf, back cover and metal color — and add your own logo.";
const DESC_TR =
  "Tamamen özelleştirilebilir mobil araba. Boyut ve yüzeyi seç; gövde, tente, tekerlek, raf, arka kapak ve metal rengini yapılandır — ve kendi logonu ekle.";

// 4 konfigüre edilebilir ürün — configurator.ts'teki CONFIG_PRODUCTS'tan türetilir.
const configProducts: Product[] = CONFIG_PRODUCTS.map((cp) => {
  const specs = specsFor(cp.size);
  return {
    slug: cp.slug,
    title: cp.label.en,
    price: `${formatPrice(cp.basePrice)} USD`,
    image: KART_VITRIN[cp.slug] ?? heroImageFor(cp.size),
    finish: cp.finish,
    gallery: galleryFor(cp.size),
    tagline: "Mobile Cart — fully customizable",
    description: DESC_EN,
    features: baseFeaturesEn,
    specs: specs.en,
    tr: {
      title: cp.label.tr,
      tagline: "Mobil Araba — tamamen özelleştirilebilir",
      description: DESC_TR,
      features: baseFeatures,
      specs: specs.tr,
    },
  };
});

// Vitrin (showcase) ürünleri — KONFIGÜRE edilemez ayrı SKU değil; var olan render
// varyantlarıyla çeşitliliği sergiler (boy/raf/tente/tekerlek/renk). Kart tıklanınca
// configSlug ile ilgili konfigüratöre (boyut/yüzey ön-seçili) gider.
function makeShowcase(o: {
  slug: string;
  configSlug: string;
  size: "100cm" | "150cm";
  image: string;
  finish: "mat" | "lake";
  titleEn: string;
  titleTr: string;
}): Product {
  const cp = CONFIG_PRODUCTS.find((c) => c.slug === o.configSlug)!;
  const specs = specsFor(o.size);
  return {
    slug: o.slug,
    configSlug: o.configSlug,
    title: o.titleEn,
    price: `${formatPrice(cp.basePrice)} USD`,
    image: o.image,
    finish: o.finish,
    gallery: galleryFor(o.size),
    tagline: "Mobile Cart — fully customizable",
    description: DESC_EN,
    features: baseFeaturesEn,
    specs: specs.en,
    tr: {
      title: o.titleTr,
      tagline: "Mobil Araba — tamamen özelleştirilebilir",
      description: DESC_TR,
      features: baseFeatures,
      specs: specs.tr,
    },
  };
}

const showcaseProducts: Product[] = [
  makeShowcase({ slug: "vitrin-150-rafli-kirmizi", configSlug: "kart-150-parlak-lake", size: "150cm", image: "/renders/150/hero-kirmizi-on.webp", finish: "lake", titleEn: "150 cm Shelf · Red", titleTr: "150 cm Raflı · Kırmızı" }),
  makeShowcase({ slug: "vitrin-150-rafli-sade", configSlug: "kart-150-mat-lam", size: "150cm", image: "/renders/150/hero-on-tekeryok-tenteyok.webp", finish: "mat", titleEn: "150 cm Shelf · Minimal (no awning)", titleTr: "150 cm Raflı · Sade (tentesiz)" }),
  makeShowcase({ slug: "vitrin-150-tutamac-yesil", configSlug: "kart-150-parlak-lake", size: "150cm", image: "/renders/150-rafsiz/hero-yesil-on.webp", finish: "lake", titleEn: "150 cm Handle · Green", titleTr: "150 cm Tutamaçlı · Yeşil" }),
  makeShowcase({ slug: "vitrin-100-rafli-siyah", configSlug: "kart-100-mat-lam", size: "100cm", image: "/renders/100-rafli/hero-siyah-on.webp", finish: "mat", titleEn: "100 cm Shelf · Black", titleTr: "100 cm Raflı · Siyah" }),
  makeShowcase({ slug: "vitrin-100-rafli-kirmizi", configSlug: "kart-100-parlak-lake", size: "100cm", image: "/renders/100-rafli/hero-kirmizi-on-tenteyok.webp", finish: "lake", titleEn: "100 cm Shelf · Red (no awning)", titleTr: "100 cm Raflı · Kırmızı (tentesiz)" }),
  makeShowcase({ slug: "vitrin-100-tutamac-yesil", configSlug: "kart-100-mat-lam", size: "100cm", image: "/renders/hero-yesil-on-tekeryok.webp", finish: "mat", titleEn: "100 cm Handle · Green (no wheels)", titleTr: "100 cm Tutamaçlı · Yeşil (tekerleksiz)" }),
];

// Vitrin: önce 4 konfigüre ürün, sonra 6 çeşitli showcase = 10 kart.
export const products: Product[] = [...configProducts, ...showcaseProducts];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

/**
 * Ürünü aktif locale'e göre yerelleştir. Aynı şekli döndürür ama
 * title/tagline/description/features/specs alanlarını locale sürümüyle değiştirir.
 */
export function localizeProduct(p: Product, locale: "en" | "tr"): Product {
  if (locale !== "tr" || !p.tr) return p;
  return {
    ...p,
    title: p.tr.title ?? p.title,
    tagline: p.tr.tagline ?? p.tagline,
    description: p.tr.description ?? p.description,
    features: p.tr.features ?? p.features,
    specs: p.tr.specs ?? p.specs,
  };
}
