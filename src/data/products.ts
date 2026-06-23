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

// 4 konfigüre edilebilir ürün — configurator.ts'teki CONFIG_PRODUCTS'tan türetilir.
export const products: Product[] = CONFIG_PRODUCTS.map((cp) => {
  const specs = specsFor(cp.size);
  return {
    slug: cp.slug,
    title: cp.label.en,
    price: `${formatPrice(cp.basePrice)} USD`,
    image: KART_VITRIN[cp.slug] ?? heroImageFor(cp.size),
    finish: cp.finish,
    gallery: galleryFor(cp.size),
    tagline: "Mobile Cart — fully customizable",
    description:
      "A fully customizable mobile cart. Choose size and finish, then configure body, awning, wheels, shelf, back cover and metal color — and add your own logo.",
    features: baseFeaturesEn,
    specs: specs.en,
    tr: {
      title: cp.label.tr,
      tagline: "Mobil Araba — tamamen özelleştirilebilir",
      description:
        "Tamamen özelleştirilebilir mobil araba. Boyut ve yüzeyi seç; gövde, tente, tekerlek, raf, arka kapak ve metal rengini yapılandır — ve kendi logonu ekle.",
      features: baseFeatures,
      specs: specs.tr,
    },
  };
});

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
