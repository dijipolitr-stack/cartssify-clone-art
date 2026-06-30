import { CONFIG_PRODUCTS, formatPrice, type Selection } from "@/data/configurator";

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
  /** Kart açılınca CustomizeDialog'un ön-seçeceği renk + varyant (raf/tente/tekerlek). */
  init?: Partial<Selection>;
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
  init?: Partial<Selection>;
  gallery?: string[];
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
    init: o.init,
    gallery: o.gallery ?? galleryFor(o.size),
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

// Vitrin (ürünler sayfası): markanın gönderdiği gerçek görseller — çeşitli renk/
// varyant/yüzey örnekleri. Kart tıklanınca ürün sayfası, oradan "Özelleştir" ile
// CustomizeDialog o renk + varyant ÖN-SEÇİLİ açılır; kullanıcı her şeyi değiştirir.
export const products: Product[] = [
  makeProduct({ slug: "kart-kirmizi-tenteli-lake", configSlug: "kart-100-parlak-lake", size: "100cm", image: "/products/kirmizi-on-lake.webp", finish: "lake", titleEn: "Red · With Awning · Lacquer", titleTr: "Kırmızı · Tenteli · Lake", init: { govdeRengi: "kirmizi", kumasTente: "var", dekoratifTekerlek: "var", tutamacRaf: "tutamac" }, gallery: [] }),
  makeProduct({ slug: "kart-kirmizi-tekersiz-lake", configSlug: "kart-100-parlak-lake", size: "100cm", image: "/products/kirmizi-on-sag-tekeryok-lake.webp", finish: "lake", titleEn: "Red · No Decorative Wheel · Lacquer", titleTr: "Kırmızı · Tekerleksiz · Lake", init: { govdeRengi: "kirmizi", kumasTente: "var", dekoratifTekerlek: "yok", tutamacRaf: "tutamac" }, gallery: [] }),
  makeProduct({ slug: "kart-mavi-sade-mat", configSlug: "kart-100-mat-lam", size: "100cm", image: "/products/mavi-on-tekeryok-tenteyok-mat.webp", finish: "mat", titleEn: "Blue · Minimal · Matte", titleTr: "Mavi · Sade · Mat", init: { govdeRengi: "mavi", kumasTente: "yok", dekoratifTekerlek: "yok", tutamacRaf: "tutamac" }, gallery: [] }),
  makeProduct({ slug: "kart-siyah-tekersiz-lake", configSlug: "kart-100-parlak-lake", size: "100cm", image: "/products/siyah-on-sol-tekeryok-lake.webp", finish: "lake", titleEn: "Black · No Decorative Wheel · Lacquer", titleTr: "Siyah · Tekerleksiz · Lake", init: { govdeRengi: "siyah", kumasTente: "var", dekoratifTekerlek: "yok", tutamacRaf: "tutamac" }, gallery: [] }),
  makeProduct({ slug: "kart-yesil-tentesiz-lake", configSlug: "kart-100-parlak-lake", size: "100cm", image: "/products/yesil-on-sol-tenteyok-lake.webp", finish: "lake", titleEn: "Green · No Awning · Lacquer", titleTr: "Yeşil · Tentesiz · Lake", init: { govdeRengi: "yesil", kumasTente: "yok", dekoratifTekerlek: "var", tutamacRaf: "tutamac" }, gallery: [] }),
  makeProduct({ slug: "kart-beyaz-tekerlekli-lake", configSlug: "kart-100-parlak-lake", size: "100cm", image: "/products/g-beyaz-tam.webp", finish: "lake", titleEn: "White · No Awning · With Wheel · Lacquer", titleTr: "Beyaz · Tentesiz · Tekerlekli · Lake", init: { govdeRengi: "beyaz", kumasTente: "yok", dekoratifTekerlek: "var", tutamacRaf: "raf" }, gallery: [] }),
  makeProduct({ slug: "kart-mavi-rafli-lake", configSlug: "kart-100-parlak-lake", size: "100cm", image: "/products/g-mavi-tam.webp", finish: "lake", titleEn: "Blue · With Shelf · Lacquer", titleTr: "Mavi · Raflı · Lake", init: { govdeRengi: "mavi", kumasTente: "var", dekoratifTekerlek: "yok", tutamacRaf: "raf" }, gallery: [] }),
  makeProduct({ slug: "kart-yesil-rafli-lake", configSlug: "kart-100-parlak-lake", size: "100cm", image: "/products/g-yesil-tam.webp", finish: "lake", titleEn: "Green · With Shelf · Lacquer", titleTr: "Yeşil · Raflı · Lake", init: { govdeRengi: "yesil", kumasTente: "var", dekoratifTekerlek: "yok", tutamacRaf: "raf" }, gallery: [] }),
  makeProduct({ slug: "kart-siyah-rafli-lake", configSlug: "kart-100-parlak-lake", size: "100cm", image: "/products/g-siyah-tam.webp", finish: "lake", titleEn: "Black · With Shelf · Lacquer", titleTr: "Siyah · Raflı · Lake", init: { govdeRengi: "siyah", kumasTente: "var", dekoratifTekerlek: "yok", tutamacRaf: "raf" }, gallery: [] }),
  // --- 150 cm ürünler ---
  makeProduct({ slug: "kart-150-beyaz-tenteli-lake", configSlug: "kart-150-parlak-lake", size: "150cm", image: "/products/g150-beyaz-tenteli.webp", finish: "lake", titleEn: "150 cm · White · With Awning · Lacquer", titleTr: "150 cm · Beyaz · Tenteli · Lake", init: { govdeRengi: "beyaz", kumasTente: "var", dekoratifTekerlek: "var", tutamacRaf: "tutamac" }, gallery: [] }),
  makeProduct({ slug: "kart-150-mavi-tenteli-lake", configSlug: "kart-150-parlak-lake", size: "150cm", image: "/products/g150-mavi-tenteli.webp", finish: "lake", titleEn: "150 cm · Blue · With Awning · Lacquer", titleTr: "150 cm · Mavi · Tenteli · Lake", init: { govdeRengi: "mavi", kumasTente: "var", dekoratifTekerlek: "var", tutamacRaf: "tutamac" }, gallery: [] }),
  makeProduct({ slug: "kart-150-beyaz-tentesiz-lake", configSlug: "kart-150-parlak-lake", size: "150cm", image: "/products/g150-beyaz-tentesiz.webp", finish: "lake", titleEn: "150 cm · White · No Awning · Lacquer", titleTr: "150 cm · Beyaz · Tentesiz · Lake", init: { govdeRengi: "beyaz", kumasTente: "yok", dekoratifTekerlek: "var", tutamacRaf: "tutamac" }, gallery: [] }),
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
