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

// Ürünler sayfası 4 ANA ürün gösterir: boy (100/150) × tente (var/yok), beyaz.
// Kart tıklanınca configSlug ile konfigüratör açılır; renk ve diğer tüm özelleştirmeler
// (tente, tekerlek, raf, arka kapak, metal, mockup) ürün DETAY sayfasında yapılır.
function makeProduct(o: {
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

// 4 ANA ürün: 100/150 cm × tenteli/tentesiz, beyaz. Detayda renk + tüm özelleştirme.
export const products: Product[] = [
  makeProduct({ slug: "kart-150-tenteli", configSlug: "kart-150-mat-lam", size: "150cm", image: "/renders/150/hero-on.webp", finish: "mat", titleEn: "150 cm — With Awning", titleTr: "150 cm — Tenteli" }),
  makeProduct({ slug: "kart-150-tentesiz", configSlug: "kart-150-mat-lam", size: "150cm", image: "/renders/150/hero-on-tenteyok.webp", finish: "mat", titleEn: "150 cm — No Awning", titleTr: "150 cm — Tentesiz" }),
  makeProduct({ slug: "kart-100-tenteli", configSlug: "kart-100-mat-lam", size: "100cm", image: "/renders/100-rafli/hero-on.webp", finish: "mat", titleEn: "100 cm — With Awning", titleTr: "100 cm — Tenteli" }),
  makeProduct({ slug: "kart-100-tentesiz", configSlug: "kart-100-mat-lam", size: "100cm", image: "/renders/100-rafli/hero-on-tenteyok.webp", finish: "mat", titleEn: "100 cm — No Awning", titleTr: "100 cm — Tentesiz" }),
];

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
