import {
  ANGLES,
  CONFIG_PRODUCTS,
  formatPrice,
  type AngleId,
} from "@/data/configurator";
import { cartPreviewSvg, svgToDataUri } from "@/lib/cart-preview";

export type Product = {
  slug: string;
  title: string;
  price: string;
  image: string;
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
// Placeholder katalog görselleri — tam donanımlı (showcase) konfigürasyonun
// şematik SVG'si. Gerçek V-Ray render'ları gelince (RENDER_BRIEF.md Faz 1)
// bu görseller gerçek PNG'lerle değiştirilir.
// --------------------------------------------------------------------------
const SHOWCASE = {
  bodyHex: "#f3f1ec", // Beyaz gövde
  tente: true,
  tenteHex: "#f3f1ec", // Beyaz tente
  wheelsDecorative: true,
  shelf: true, // Raflı
  backCover: true, // Arka kapaklı
  metalHex: "#c9ccd1", // Krom
} as const;

function showcaseImage(angle: AngleId): string {
  return svgToDataUri(cartPreviewSvg({ angle, ...SHOWCASE }));
}

const heroImage = showcaseImage("on");
const galleryImages = ANGLES.filter((a) => a.id !== "on").map((a) => showcaseImage(a.id));

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
    image: heroImage,
    gallery: galleryImages,
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
