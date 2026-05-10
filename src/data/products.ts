import cart12Natural from "@/assets/cart-12-natural.jpg";
import displayCart12Black from "@/assets/products/display-cart-12-black.jpg";
import cart15BlackHeavyDuty from "@/assets/products/cart-15-black-heavy-duty.jpg";
import slideInLogoFrontPanel from "@/assets/products/slide-in-logo-front-panel.jpg";
import mobileCoffeeCartFabricRoofCanopy from "@/assets/products/mobile-coffee-cart-fabric-roof-canopy.jpg";
import openCornerMobileBar3Cart from "@/assets/products/open-corner-mobile-bar-3-cart.jpg";
import lShapedMobileDisplayCounter from "@/assets/products/l-shaped-mobile-display-counter.jpg";
import modularUShapedMobileEventBar from "@/assets/products/modular-u-shaped-mobile-event-bar.jpg";
import mobileCoffeeCartDisplayStandsSet from "@/assets/products/mobile-coffee-cart-display-stands-set.jpg";
import displayCart12WithSlideInLogo from "@/assets/products/display-cart-12-with-slide-in-logo.jpg";
import comingSoon from "@/assets/products/coming-soon.svg";

// Customize render sets — per-product, six colors each
import cart12Nat from "@/assets/products/cart-12-renders/cart-12-natural.png";
import cart12Wht from "@/assets/products/cart-12-renders/cart-12-white.png";
import cart12Blk from "@/assets/products/cart-12-renders/cart-12-black.png";
import cart12Snd from "@/assets/products/cart-12-renders/cart-12-sand.png";
import cart12Olv from "@/assets/products/cart-12-renders/cart-12-olive.png";
import cart12Trc from "@/assets/products/cart-12-renders/cart-12-terracotta.png";

import canopyNat from "@/assets/products/open-corner-3cart-renders/open-corner-3cart-natural.png";
import canopyWht from "@/assets/products/open-corner-3cart-renders/open-corner-3cart-white.png";
import canopyBlk from "@/assets/products/open-corner-3cart-renders/open-corner-3cart-black.png";
import canopySnd from "@/assets/products/open-corner-3cart-renders/open-corner-3cart-sand.png";
import canopyOlv from "@/assets/products/open-corner-3cart-renders/open-corner-3cart-olive.png";
import canopyTrc from "@/assets/products/open-corner-3cart-renders/open-corner-3cart-terracotta.png";

import slideNat from "@/assets/products/display-cart-slide-renders/display-cart-slide-natural.png";
import slideWht from "@/assets/products/display-cart-slide-renders/display-cart-slide-white.png";
import slideBlk from "@/assets/products/display-cart-slide-renders/display-cart-slide-black.png";
import slideSnd from "@/assets/products/display-cart-slide-renders/display-cart-slide-sand.png";
import slideOlv from "@/assets/products/display-cart-slide-renders/display-cart-slide-olive.png";
import slideTrc from "@/assets/products/display-cart-slide-renders/display-cart-slide-terracotta.png";

import cart15Nat from "@/assets/products/cart-15-renders/cart-15-natural.png";
import cart15Wht from "@/assets/products/cart-15-renders/cart-15-white.png";
import cart15Blk from "@/assets/products/cart-15-renders/cart-15-black.png";
import cart15Snd from "@/assets/products/cart-15-renders/cart-15-sand.png";
import cart15Olv from "@/assets/products/cart-15-renders/cart-15-olive.png";
import cart15Trc from "@/assets/products/cart-15-renders/cart-15-terracotta.png";

const CART_12_RENDERS = {
  Natural: cart12Nat,
  White: cart12Wht,
  Black: cart12Blk,
  Sand: cart12Snd,
  Olive: cart12Olv,
  Terracotta: cart12Trc,
} as const;

const OPEN_CORNER_3CART_RENDERS = {
  Natural: canopyNat,
  White: canopyWht,
  Black: canopyBlk,
  Sand: canopySnd,
  Olive: canopyOlv,
  Terracotta: canopyTrc,
} as const;

const DISPLAY_CART_SLIDE_RENDERS = {
  Natural: slideNat,
  White: slideWht,
  Black: slideBlk,
  Sand: slideSnd,
  Olive: slideOlv,
  Terracotta: slideTrc,
} as const;

const CART_15_RENDERS = {
  Natural: cart15Nat,
  White: cart15Wht,
  Black: cart15Blk,
  Sand: cart15Snd,
  Olive: cart15Olv,
  Terracotta: cart15Trc,
} as const;

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
  /** When true, this product is shown in the catalog with a "Coming Soon" badge instead of an Add-to-cart action. */
  comingSoon?: boolean;
  /**
   * Per-color render images shown inside the Customize dialog. When omitted the
   * dialog falls back to a default set so older products still work; products
   * with their own set should always provide all six colors keyed by color name.
   */
  customizeRenders?: {
    Natural: string;
    White: string;
    Black: string;
    Sand: string;
    Olive: string;
    Terracotta: string;
  };
  /**
   * Turkish translations of the user-facing strings. When the active locale is
   * `tr` we render these instead of the English defaults; falling back to
   * English keeps things sane for any field a translator hasn't covered yet.
   */
  tr?: {
    title?: string;
    tagline?: string;
    description?: string;
    features?: string[];
    specs?: { label: string; value: string }[];
  };
};

const baseDescription =
  "High-quality, portable display solution designed for events, pop-ups and on-the-go retail. Built from durable plywood with a clean, modern design that puts your brand at the center.";

const baseDescriptionTr =
  "Etkinlikler, pop-up'lar ve mobil perakende için tasarlanmış yüksek kaliteli, taşınabilir teşhir çözümü. Markanızı ön plana çıkaran sade ve modern tasarımlı, dayanıklı kontrplaktan üretilmiştir.";

const baseFeatures = [
  "Customizable front panel — insert your logo or artwork",
  "Foldable, flat-pack design for easy transport",
  "Smooth wheels with brakes for secure placement",
  "Built from 12mm thick plywood for daily commercial use",
];

const baseFeaturesTr = [
  "Özelleştirilebilir ön panel — logonuzu veya görselinizi yerleştirin",
  "Katlanabilir, flat-pack tasarım — kolay taşıma",
  "Frenli kaydırmaz tekerlekler — güvenli sabitleme",
  "12mm kalın kontrplaktan üretilmiş — günlük ticari kullanıma uygun",
];

export const products: Product[] = [
  // === Top tier: products with their own custom render set ===
  {
    slug: "cart-12-natural",
    title: "Cart 12 Natural",
    price: "$1,800.00 USD",
    image: cart12Natural,
    gallery: [],
    tagline: "Mobile Coffee Cart — Natural Plywood",
    description:
      "Showcase your products in style with our flagship Mobile Coffee Cart. Designed with mobility in mind, it disassembles into a flat-pack secured with a safety belt — transportation is as simple as packing a suitcase.",
    features: [
      ...baseFeatures,
      "Worktop holds up to 150kg (265 lbs)",
      "Each shelf supports up to 80kg (176 lbs)",
    ],
    specs: [
      { label: "Length", value: "180 cm (70.9 in)" },
      { label: "Depth", value: "75 cm (29.5 in)" },
      { label: "Height", value: "95 cm (37.6 in)" },
      { label: "Total weight", value: "50 kg (110 lbs)" },
    ],
    customizeRenders: CART_12_RENDERS,
    tr: {
      title: "Cart 12 Natural",
      tagline: "Mobil Kahve Tezgahı — Natural Kontrplak",
      description:
        "Ürünlerinizi şık bir şekilde sergileyin: amiral gemimiz Mobil Kahve Tezgahı. Hareketlilik düşünülerek tasarlandı; flat-pack şeklinde sökülüp emniyet kemeriyle sabitleniyor — taşıması bavul kadar kolay.",
      features: [
        ...baseFeaturesTr,
        "Tezgah üstü 150 kg'a kadar yük taşır",
        "Her raf 80 kg'a kadar yük taşır",
      ],
      specs: [
        { label: "Uzunluk", value: "180 cm" },
        { label: "Derinlik", value: "75 cm" },
        { label: "Yükseklik", value: "95 cm" },
        { label: "Toplam ağırlık", value: "50 kg" },
      ],
    },
  },
  {
    slug: "open-corner-mobile-bar-3-cart",
    title: "Open Corner Mobile Bar Setup – 3-Cart Modular",
    price: "From $6,590.00 USD",
    image: openCornerMobileBar3Cart,
    tagline: "Three carts with open corners",
    description:
      "A three-cart modular setup with open corners — ideal for medium events that need a substantial bar without sacrificing staff flow.",
    features: [
      "Three carts + open corner connectors",
      "Substantial bar presence",
      "Modular flat-pack transport",
    ],
    customizeRenders: OPEN_CORNER_3CART_RENDERS,
    tr: {
      title: "Açık Köşe Mobil Bar Kurulumu – 3'lü Tezgah Modüler",
      tagline: "Açık köşeli üçlü tezgah seti",
      description:
        "Açık köşe bağlantılarıyla üçlü modüler bir kurulum — orta ölçekli etkinliklerde personel akışından ödün vermeden iddialı bir bar görünümü için ideal.",
      features: [
        "Üç adet tezgah + açık köşe bağlantıları",
        "Etkileyici bar varlığı",
        "Modüler flat-pack taşıma",
      ],
    },
  },
  {
    slug: "display-cart-12-with-slide-in-logo",
    title: "Display Cart 12 Black with Slide-in Logo Function",
    price: "$2,100.00 USD",
    image: displayCart12WithSlideInLogo,
    tagline: "Black Cart 12 with built-in logo slot",
    description:
      "Our black display cart with the slide-in logo function pre-installed — change brand artwork in seconds without modifying the cart.",
    features: [
      ...baseFeatures,
      "Built-in slide-in logo slot",
      "Swap artwork between events without tools",
    ],
    customizeRenders: DISPLAY_CART_SLIDE_RENDERS,
    tr: {
      title: "Display Cart 12 Siyah – Sürmeli Logo Yuvalı",
      tagline: "Logo yuvası entegre siyah Cart 12",
      description:
        "Sürmeli logo işlevi fabrika çıkışı entegre edilmiş siyah teşhir tezgahımız — etkinlikler arasında marka görselinizi saniyeler içinde değiştirin, tezgaha hiç dokunmadan.",
      features: [
        ...baseFeaturesTr,
        "Entegre sürmeli logo yuvası",
        "Etkinlikler arasında alet kullanmadan görsel değişimi",
      ],
    },
  },
  {
    slug: "cart-15-black-heavy-duty",
    title: "Cart 15 Black Heavy Duty",
    price: "$2,200.00 USD",
    image: cart15BlackHeavyDuty,
    tagline: "Heavy-duty, larger format display cart",
    description:
      "Our largest cart, built for high-traffic environments and heavier displays. The 15mm plywood construction adds strength while preserving the clean Rumicarts silhouette.",
    features: [
      ...baseFeatures,
      "15mm plywood construction for extra strength",
      "Higher load capacity for heavier displays",
    ],
    customizeRenders: CART_15_RENDERS,
    tr: {
      title: "Cart 15 Siyah Heavy Duty",
      tagline: "Daha büyük formatlı, ağır iş tezgahı",
      description:
        "En büyük tezgahımız: yoğun trafikli alanlar ve daha ağır teşhirler için üretildi. 15 mm kontrplak yapı, Rumicarts'ın sade siluetini koruyarak ekstra güç sağlar.",
      features: [
        ...baseFeaturesTr,
        "15 mm kontrplak yapı — ekstra dayanıklılık",
        "Daha ağır teşhirler için yüksek taşıma kapasitesi",
      ],
    },
  },

  // === Customize-able products without their own render set yet (Cart 12 fallback) ===
  {
    slug: "display-cart-12-black",
    title: "Display Cart 12 - Black",
    price: "$1,950.00 USD",
    image: displayCart12Black,
    tagline: "Display Cart 12 in matte black",
    description:
      "The bold, all-black version of our most popular cart. Perfect for premium brands that want a sleek, statement-making display piece for events, pop-ups and retail floors.",
    features: baseFeatures,
    specs: [
      { label: "Length", value: "180 cm (70.9 in)" },
      { label: "Depth", value: "75 cm (29.5 in)" },
      { label: "Height", value: "95 cm (37.6 in)" },
    ],
    tr: {
      title: "Display Cart 12 - Siyah",
      tagline: "Mat siyah Display Cart 12",
      description:
        "En popüler tezgahımızın iddialı, tamamen siyah versiyonu. Etkinlik, pop-up ve perakende mağazaları için sade ama göz alıcı bir teşhir aracı arayan premium markalar için ideal.",
      features: baseFeaturesTr,
      specs: [
        { label: "Uzunluk", value: "180 cm" },
        { label: "Derinlik", value: "75 cm" },
        { label: "Yükseklik", value: "95 cm" },
      ],
    },
  },
  {
    slug: "mobile-coffee-cart-fabric-roof-canopy",
    title: "Mobile Coffee Cart with Fabric Roof Canopy",
    price: "From $2,900.00 USD",
    image: mobileCoffeeCartFabricRoofCanopy,
    tagline: "Cart 12 with integrated fabric canopy",
    description:
      "Our Mobile Coffee Cart paired with a removable fabric roof canopy — adding shade, presence and a strong silhouette for outdoor events and street vendors.",
    features: [
      ...baseFeatures,
      "Removable fabric canopy in multiple colors",
      "Stronger visual presence for outdoor events",
    ],
    tr: {
      title: "Kumaş Çatılı Mobil Kahve Tezgahı",
      tagline: "Entegre kumaş çatılı Cart 12",
      description:
        "Mobil Kahve Tezgahımız, çıkarılabilir kumaş çatı kanopisiyle birlikte — açık hava etkinlikleri ve sokak satıcıları için gölge, varlık ve güçlü bir siluet sağlar.",
      features: [
        ...baseFeaturesTr,
        "Birden fazla renkte çıkarılabilir kumaş kanopi",
        "Açık hava etkinliklerinde güçlü görsel varlık",
      ],
    },
  },
  {
    slug: "slide-in-logo-front-panel",
    title: "Slide-in Logo Option for Front Panel",
    price: "$100.00 USD",
    image: slideInLogoFrontPanel,
    tagline: "Brand your cart in seconds",
    description:
      "A custom front-panel slot that lets you slide in printed logos or campaign artwork without damaging the cart. Swap visuals between events, seasons, or pop-ups.",
    features: [
      "Easy slide-in / slide-out artwork system",
      "No damage to the cart finish",
      "Perfect for seasonal campaigns and rotating brands",
    ],
    tr: {
      title: "Ön Panel için Sürmeli Logo Opsiyonu",
      tagline: "Tezgahınızı saniyeler içinde markalayın",
      description:
        "Ön panele entegre özel bir yuva: basılı logoları veya kampanya görsellerini tezgaha zarar vermeden takıp çıkarın. Etkinlikler, sezonlar veya pop-up'lar arasında görselinizi değiştirin.",
      features: [
        "Kolay sürmeli takıp-çıkarma sistemi",
        "Tezgah yüzeyine zarar vermez",
        "Sezonluk kampanyalar ve dönüşümlü markalar için ideal",
      ],
    },
  },
  {
    slug: "mobile-coffee-cart-display-stands-set",
    title: "Mobile Coffee Cart and 3 Adjustable Display Stands Set",
    price: "$3,500.00 USD",
    image: mobileCoffeeCartDisplayStandsSet,
    tagline: "Cart + matching display stands bundle",
    description:
      "A complete merchandising set: our Mobile Coffee Cart paired with 3 adjustable display stands. A turnkey solution for retailers launching pop-ups or trade-show booths.",
    features: [
      "Mobile Coffee Cart included",
      "3 adjustable display stands",
      "Turnkey solution for pop-ups and trade shows",
    ],
    tr: {
      title: "Mobil Kahve Tezgahı ve 3 Ayarlanabilir Teşhir Standı Seti",
      tagline: "Tezgah + uyumlu teşhir standları paketi",
      description:
        "Eksiksiz bir teşhir seti: Mobil Kahve Tezgahımız ve 3 adet ayarlanabilir teşhir standı. Pop-up veya fuar standı kuran perakendeciler için anahtar teslim çözüm.",
      features: [
        "Mobil Kahve Tezgahı dahil",
        "3 adet ayarlanabilir teşhir standı",
        "Pop-up ve fuarlar için anahtar teslim çözüm",
      ],
    },
  },
  {
    slug: "l-shaped-mobile-display-counter",
    title: "L-Shaped Mobile Display Counter",
    price: "From $6,790.00 USD",
    image: lShapedMobileDisplayCounter,
    tagline: "L-shape with corner & straight connectors",
    description:
      "Combines straight and corner connectors into a single L-shaped display counter — flexible, professional, and ready for serious event work.",
    features: [
      "Combines straight + corner connectors",
      "Flexible L-shape configuration",
      "Modular Rumicarts system",
    ],
    tr: {
      title: "L-Şekilli Mobil Teşhir Tezgahı",
      tagline: "Düz + köşe bağlantılı L formu",
      description:
        "Düz ve köşe bağlantılarını tek bir L-şekilli teşhir tezgahında birleştirir — esnek, profesyonel ve ciddi etkinlik işleri için hazır.",
      features: [
        "Düz + köşe bağlantılarının birleşimi",
        "Esnek L-şekilli konfigürasyon",
        "Modüler Rumicarts sistemi",
      ],
    },
  },
  {
    slug: "modular-u-shaped-mobile-event-bar",
    title: "Modular U-Shaped Mobile Event Bar – 4-Cart",
    price: "From $8,370.00 USD",
    image: modularUShapedMobileEventBar,
    tagline: "Four-cart professional U-shape",
    description:
      "Our top-of-the-line modular setup: four carts in a U-shape that creates a fully enclosed bar for staff with maximum customer-facing surface area.",
    features: [
      "Four carts + connectors included",
      "Fully enclosed bar workspace for staff",
      "Maximum customer-facing surface",
    ],
    tr: {
      title: "Modüler U-Şekilli Mobil Etkinlik Barı – 4'lü Tezgah",
      tagline: "Dört tezgahlı profesyonel U-formu",
      description:
        "En üst seviye modüler kurulumumuz: U-şeklinde dört tezgah, personele tamamen kapalı bir bar alanı, müşteriye ise maksimum hizmet yüzeyi sunar.",
      features: [
        "Dört adet tezgah + tüm bağlantılar dahil",
        "Personel için tamamen kapalı bar alanı",
        "Müşteriye dönük maksimum yüzey",
      ],
    },
  },

  // === Coming soon products ===
  {
    slug: "extra-shelf",
    title: "Extra Shelf",
    price: "$100.00 USD",
    image: comingSoon,
    comingSoon: true,
    tagline: "Add-on shelf for any Rumicarts display cart",
    description:
      "An additional shelf for your display cart, giving you more storage and merchandising space. Compatible with all standard Rumicarts models and adjustable to multiple heights.",
    features: [
      "Compatible with all standard Rumicarts display carts",
      "Adjustable to 3 different heights",
      "Supports up to 80 kg (176 lbs)",
      "Matches your cart's finish",
    ],
    tr: {
      title: "Ek Raf",
      tagline: "Tüm Rumicarts teşhir tezgahları için ek raf",
      description:
        "Teşhir tezgahınız için ekstra bir raf — daha fazla depolama ve teşhir alanı sağlar. Tüm standart Rumicarts modelleriyle uyumlu, çoklu yükseklik ayarına sahip.",
      features: [
        "Tüm standart Rumicarts teşhir tezgahlarıyla uyumlu",
        "3 farklı yüksekliğe ayarlanabilir",
        "80 kg'a kadar yük taşır",
        "Tezgahınızın yüzeyiyle uyumlu",
      ],
    },
  },
  {
    slug: "sink-edition",
    title: "Sink Edition",
    price: "From $2,500.00 USD",
    image: comingSoon,
    comingSoon: true,
    tagline: "Display cart with built-in sink module",
    description:
      "A purpose-built version of our display cart with an integrated sink module — ideal for coffee, cocktails, juice bars and any pop-up that needs water on the go.",
    features: [
      "Integrated stainless steel sink",
      "Compatible with portable water tanks",
      "Same flat-pack mobility as the standard cart",
    ],
    tr: {
      title: "Lavabolu Versiyon",
      tagline: "Entegre lavabo modüllü teşhir tezgahı",
      description:
        "Teşhir tezgahımızın özel olarak üretilmiş, entegre lavabo modüllü versiyonu — kahve, kokteyl, meyve suyu barları ve hareket halinde su gerektiren her tür pop-up için ideal.",
      features: [
        "Entegre paslanmaz çelik lavabo",
        "Taşınabilir su tankları ile uyumlu",
        "Standart tezgahla aynı flat-pack hareket kolaylığı",
      ],
    },
  },
  {
    slug: "2-cart-straight-line-mobile-bar",
    title: "2-Cart Straight-Line Mobile Bar",
    price: "From $4,310.00 USD",
    image: comingSoon,
    comingSoon: true,
    tagline: "Two carts joined into a continuous bar",
    description:
      "Two display carts connected with a straight connector to form a continuous, professional event counter — perfect for bars, sampling stations and product launches.",
    features: [
      "Two carts + straight connector included",
      "Forms a continuous 3.6m bar surface",
      "Modular: separate carts for smaller events",
    ],
    tr: {
      title: "2'li Tezgah Düz Hat Mobil Bar",
      tagline: "Düz hatta birleşmiş iki tezgah",
      description:
        "Düz bir bağlantıyla birleştirilen iki teşhir tezgahı — sürekli, profesyonel bir etkinlik tezgahı oluşturur. Bar, tadım istasyonları ve ürün lansmanları için ideal.",
      features: [
        "İki adet tezgah + düz bağlantı dahil",
        "Sürekli 3,6 m bar yüzeyi oluşturur",
        "Modüler: küçük etkinliklerde tezgahlar ayrılabilir",
      ],
    },
  },
  {
    slug: "l-shaped-mobile-bar-closed-corner-2-cart",
    title: "L-Shaped Mobile Cart System – Closed Corner (2-Cart)",
    price: "From $4,460.00 USD",
    image: comingSoon,
    comingSoon: true,
    tagline: "Two-cart L-shape with a closed corner",
    description:
      "An L-shaped two-cart configuration with a closed corner module — a compact, professional setup for tight venues that still need a serving bar feel.",
    features: [
      "Two carts + closed corner connector",
      "Compact L-shape footprint",
      "Easy to break down into individual carts",
    ],
    tr: {
      title: "L-Şekilli Mobil Tezgah Sistemi – Kapalı Köşe (2'li Tezgah)",
      tagline: "Kapalı köşeli iki tezgahlı L-formu",
      description:
        "Kapalı köşe modüllü L-şekilli iki tezgah konfigürasyonu — dar mekanlarda profesyonel bir bar hissi sağlayan kompakt bir kurulum.",
      features: [
        "İki adet tezgah + kapalı köşe bağlantısı",
        "Kompakt L-formu",
        "Bireysel tezgahlara kolayca ayrılır",
      ],
    },
  },
  {
    slug: "l-shaped-mobile-bar-open-corner-2-cart",
    title: "2-Cart L-Shaped Mobile Bar – Open Corner",
    price: "From $4,260.00 USD",
    image: comingSoon,
    comingSoon: true,
    tagline: "Two-cart L-shape with an open corner",
    description:
      "An L-shape with an open corner — gives staff free movement between both sides while presenting a professional bar to customers.",
    features: [
      "Two carts + open corner module",
      "Open access for staff movement",
      "Modular: rearrange for any venue",
    ],
    tr: {
      title: "2'li Tezgah L-Şekilli Mobil Bar – Açık Köşe",
      tagline: "Açık köşeli iki tezgahlı L-formu",
      description:
        "Açık köşeli bir L-formu — personele iki taraf arasında serbest hareket imkânı verirken müşteriye profesyonel bir bar sunar.",
      features: [
        "İki adet tezgah + açık köşe modülü",
        "Personel hareketi için açık erişim",
        "Modüler: her tür mekana göre yeniden düzenlenebilir",
      ],
    },
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

/**
 * Localize a product for the active UI locale. Returns the same product shape
 * but with title/tagline/description/features/specs swapped to the locale's
 * version when present (and fallback to the English original otherwise).
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
