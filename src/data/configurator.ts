/**
 * Rumicarts Konfigüratör — merkezi yapı.
 *
 * Tek doğruluk kaynağı: 4 ürün (Malzeme Seçimi), 7 kriter, mockup yüzeyleri,
 * opsiyon bazlı fiyatlar ve render dosya adlandırması burada tanımlı.
 *
 * NOT: Fiyatlar (base + delta) şu an PLACEHOLDER. Gerçek rakamlar gelince
 * yalnızca bu dosyadaki sayıları değiştirmek yeterli.
 *
 * Render'lar henüz üretilmedi (bkz. RENDER_BRIEF.md). Gerçek PNG'ler gelince
 * `RENDER_REGISTRY`'ye eklenir; o zamana kadar şematik SVG placeholder gösterilir.
 */

export type Locale = "en" | "tr";

/** İki dilli kısa metin yardımcı tipi. */
export type Bi = { tr: string; en: string };

export function pick(b: Bi, locale: Locale): string {
  return locale === "tr" ? b.tr : b.en;
}

// --------------------------------------------------------------------------
// 6 açı — RENDER_BRIEF.md ile birebir aynı kodlar
// --------------------------------------------------------------------------
export type AngleId =
  | "on"
  | "on-sag"
  | "on-sol"
  | "arka"
  | "arka-sag"
  | "arka-sol";

export const ANGLES: { id: AngleId; label: Bi }[] = [
  { id: "on", label: { tr: "Ön", en: "Front" } },
  { id: "on-sag", label: { tr: "Ön Sağ Çapraz", en: "Front Right" } },
  { id: "on-sol", label: { tr: "Ön Sol Çapraz", en: "Front Left" } },
  { id: "arka", label: { tr: "Arka", en: "Back" } },
  { id: "arka-sag", label: { tr: "Arka Sağ Çapraz", en: "Back Right" } },
  { id: "arka-sol", label: { tr: "Arka Sol Çapraz", en: "Back Left" } },
];

/** Ön/arka grubu — şematik çizimde silüet yönünü belirler. */
export function isBackAngle(a: AngleId): boolean {
  return a.startsWith("arka");
}

// --------------------------------------------------------------------------
// 4 ÜRÜN — "Malzeme Seçimi" (boyut × yüzey)
// --------------------------------------------------------------------------
export type ConfigProductId = "100-mat" | "150-mat" | "100-lake" | "150-lake";

export type ConfigProduct = {
  id: ConfigProductId;
  slug: string;
  label: Bi;
  size: "100cm" | "150cm";
  finish: "mat" | "lake";
  /** PLACEHOLDER baz fiyat (USD). */
  basePrice: number;
};

export const CONFIG_PRODUCTS: ConfigProduct[] = [
  {
    id: "100-mat",
    slug: "kart-100-mat-lam",
    label: { tr: "100 cm — Mat Lam", en: "100 cm — Matte Laminate" },
    size: "100cm",
    finish: "mat",
    basePrice: 1800, // PLACEHOLDER
  },
  {
    id: "150-mat",
    slug: "kart-150-mat-lam",
    label: { tr: "150 cm — Mat Lam", en: "150 cm — Matte Laminate" },
    size: "150cm",
    finish: "mat",
    basePrice: 2200, // PLACEHOLDER
  },
  {
    id: "100-lake",
    slug: "kart-100-parlak-lake",
    label: { tr: "100 cm — Parlak Lake", en: "100 cm — Glossy Lacquer" },
    size: "100cm",
    finish: "lake",
    basePrice: 2100, // PLACEHOLDER
  },
  {
    id: "150-lake",
    slug: "kart-150-parlak-lake",
    label: { tr: "150 cm — Parlak Lake", en: "150 cm — Glossy Lacquer" },
    size: "150cm",
    finish: "lake",
    basePrice: 2500, // PLACEHOLDER
  },
];

export function getConfigProduct(id: ConfigProductId): ConfigProduct {
  return CONFIG_PRODUCTS.find((p) => p.id === id) ?? CONFIG_PRODUCTS[0];
}

export function getConfigProductBySlug(slug: string): ConfigProduct | undefined {
  return CONFIG_PRODUCTS.find((p) => p.slug === slug);
}

// --------------------------------------------------------------------------
// 7 KRİTER — her biri tek seçim, ilk değer varsayılan
// --------------------------------------------------------------------------
export type OptionValue = {
  id: string;
  label: Bi;
  /** PLACEHOLDER fiyat farkı (USD). */
  priceDelta: number;
  /** Renk swatch'ı için hex (yalnız renk kriterlerinde). */
  hex?: string;
  /** "Özel" → serbest metin alanı açar, render gerektirmez. */
  isCustom?: boolean;
  /** "Yok" → ilgili katman gösterilmez. */
  isNone?: boolean;
};

export type CriterionId =
  | "govdeRengi"
  | "kumasTente"
  | "dekoratifTekerlek"
  | "tutamacRaf"
  | "arkaKapak"
  | "metalRengi";

export type Criterion = {
  id: CriterionId;
  label: Bi;
  /** Görsel kontrol tipi. */
  control: "swatch" | "toggle" | "segment";
  /** Render katman adı (RENDER_BRIEF.md ile uyumlu) — gerçek render eşlemesi için. */
  layer: string;
  values: OptionValue[];
  /** Yalnız bu kriter şu değerdeyken etkin (ör. Tente Rengi sadece tente "var" ise). */
  dependsOn?: { criterion: CriterionId; value: string };
};

const COLOR_VALUES: OptionValue[] = [
  { id: "beyaz", label: { tr: "Beyaz", en: "White" }, priceDelta: 0, hex: "#f3f1ec" },
  { id: "siyah", label: { tr: "Siyah", en: "Black" }, priceDelta: 0, hex: "#1f1f1f" },
  { id: "yesil", label: { tr: "Yeşil", en: "Green" }, priceDelta: 0, hex: "#5d6a3a" },
  { id: "mavi", label: { tr: "Mavi", en: "Blue" }, priceDelta: 0, hex: "#34567f" },
  { id: "kirmizi", label: { tr: "Kırmızı", en: "Red" }, priceDelta: 0, hex: "#b03a2e" },
  { id: "ozel", label: { tr: "Özel", en: "Custom" }, priceDelta: 150, isCustom: true }, // PLACEHOLDER
];

// Gövde (+ tente, tek materyal) renk listesi — referans paylaşımı sorun çıkarmasın diye kopya.
const bodyColors = COLOR_VALUES.map((v) => ({ ...v }));

const METAL_VALUES: OptionValue[] = [
  { id: "krom", label: { tr: "Krom", en: "Chrome" }, priceDelta: 0, hex: "#c9ccd1" },
  { id: "pirinc", label: { tr: "Pirinç", en: "Brass" }, priceDelta: 80, hex: "#b08a3e" }, // PLACEHOLDER
  { id: "siyah", label: { tr: "Siyah", en: "Black" }, priceDelta: 60, hex: "#1f1f1f" }, // PLACEHOLDER
  { id: "beyaz", label: { tr: "Beyaz", en: "White" }, priceDelta: 60, hex: "#e8e6e1" }, // PLACEHOLDER
  { id: "ozel", label: { tr: "Özel", en: "Custom" }, priceDelta: 150, isCustom: true }, // PLACEHOLDER
];

export const CRITERIA: Criterion[] = [
  {
    id: "govdeRengi",
    // Gövde ve tente modelde tek materyal (Color M00) → tek renk seçimi ikisini de
    // kapsar; gerçek render'lar da gövde+tente birlikte renkli üretildi.
    label: { tr: "Gövde + Tente Rengi", en: "Body + Awning Color" },
    control: "swatch",
    layer: "govde",
    values: bodyColors,
  },
  {
    id: "kumasTente",
    label: { tr: "Kumaş Tente", en: "Fabric Awning" },
    control: "toggle",
    layer: "tente",
    values: [
      { id: "yok", label: { tr: "Yok", en: "None" }, priceDelta: 0, isNone: true },
      { id: "var", label: { tr: "Var", en: "Yes" }, priceDelta: 250 }, // PLACEHOLDER
    ],
  },
  {
    id: "dekoratifTekerlek",
    label: { tr: "Dekoratif Tekerlek", en: "Decorative Wheels" },
    control: "toggle",
    layer: "tekerlek",
    values: [
      { id: "yok", label: { tr: "Yok", en: "None" }, priceDelta: 0, isNone: true },
      { id: "var", label: { tr: "Var", en: "Yes" }, priceDelta: 120 }, // PLACEHOLDER
    ],
  },
  {
    id: "tutamacRaf",
    label: { tr: "Tutamaç veya Raf", en: "Handle or Shelf" },
    control: "segment",
    layer: "rafTutamac",
    values: [
      { id: "tutamac", label: { tr: "Tutamaç", en: "Handle" }, priceDelta: 0 },
      { id: "raf", label: { tr: "Raf", en: "Shelf" }, priceDelta: 90 }, // PLACEHOLDER
    ],
  },
  {
    id: "arkaKapak",
    label: { tr: "Arka Kapak", en: "Back Cover" },
    control: "toggle",
    layer: "arkakapak",
    values: [
      { id: "yok", label: { tr: "Yok", en: "None" }, priceDelta: 0, isNone: true },
      { id: "var", label: { tr: "Var", en: "Yes" }, priceDelta: 110 }, // PLACEHOLDER
    ],
  },
  {
    id: "metalRengi",
    label: { tr: "Metal Rengi", en: "Metal Color" },
    control: "swatch",
    layer: "metal",
    values: METAL_VALUES,
  },
];

/** Varsayılan seçim — her kriterin ilk değeri (spec: "İlk Değer varsayılan"). */
export function defaultSelection(): Record<CriterionId, string> {
  const out = {} as Record<CriterionId, string>;
  for (const c of CRITERIA) out[c.id] = c.values[0].id;
  return out;
}

export function getCriterion(id: CriterionId): Criterion {
  return CRITERIA.find((c) => c.id === id)!;
}

export function getOption(id: CriterionId, valueId: string): OptionValue | undefined {
  return getCriterion(id).values.find((v) => v.id === valueId);
}

/** Bir kriter mevcut seçime göre etkin mi (dependsOn kontrolü). */
export function isCriterionActive(
  c: Criterion,
  selection: Record<CriterionId, string>,
): boolean {
  if (!c.dependsOn) return true;
  return selection[c.dependsOn.criterion] === c.dependsOn.value;
}

// --------------------------------------------------------------------------
// MOCKUP — logo yükleme + yüzeylere uygulama
// --------------------------------------------------------------------------
export type MockupGroup = "govde" | "tente";

/** Normalize nokta (önizleme kutusuna göre 0..1). */
export type Pt = { x: number; y: number };
/** Yüzeyin 4 köşesi: sol-üst, sağ-üst, sağ-alt, sol-alt (saat yönü). */
export type Quad = { tl: Pt; tr: Pt; br: Pt; bl: Pt };

/** Bir yüzeyin tek bir açıdaki görünümü: logo (quad) + giydirme (fullQuad) köşeleri. */
export type SurfaceView = {
  /** LOGO için: yüzeyin merkezindeki küçük marka alanı (ortalı, oranı korunur). */
  quad: Quad;
  /** GİYDİRME için: yüzeyin TAMAMI — tam-yüzey baskı bu dörtgeni doldurur. */
  fullQuad: Quad;
};

export type MockupSurface = {
  id: string;
  group: MockupGroup;
  label: Bi;
  /**
   * Bu fiziksel yüzeyin GÖRÜNDÜĞÜ açılar + her açıdaki köşeler. Tek yüzey birden
   * çok açıdan görünür (ör. gövde ön paneli on/on-sag/on-sol açılarında), her
   * açıda kendi perspektif quad'larıyla. Gerçek render'lara kalibre edildi.
   */
  views: Partial<Record<AngleId, SurfaceView>>;
};

export const MOCKUP_SURFACES: MockupSurface[] = [
  // Gövde Ön paneli — mockup yalnızca tam oturduğu ÖN (frontal) açıda gösterilir.
  // Sağ/sol çapraz açılarda düz görseli eğimli yüzeye warp etmek yapay duruyordu;
  // overlay sadece "on" açısında bindirilir (kullanıcı kararı: ön açıya odakla).
  { id: "govde-on", group: "govde", label: { tr: "Gövde Ön Yüzü", en: "Body Front" }, views: {
      "on": { quad: { tl: { x: 0.448, y: 0.585 }, tr: { x: 0.552, y: 0.585 }, br: { x: 0.552, y: 0.682 }, bl: { x: 0.448, y: 0.682 } },
              fullQuad: { tl: { x: 0.402, y: 0.557 }, tr: { x: 0.602, y: 0.557 }, br: { x: 0.602, y: 0.713 }, bl: { x: 0.402, y: 0.713 } } },
  } },
  // Tente Ön yüzü — yalnızca ön açıda. Çatı ön yüzü (sırt→saçak) gerçek köşelere kalibre.
  { id: "tente-on", group: "tente", label: { tr: "Tente Ön Yüzü", en: "Awning Front" }, views: {
      "on": { quad: { tl: { x: 0.44, y: 0.30 }, tr: { x: 0.56, y: 0.30 }, br: { x: 0.565, y: 0.34 }, bl: { x: 0.435, y: 0.34 } },
              fullQuad: { tl: { x: 0.38, y: 0.276 }, tr: { x: 0.615, y: 0.276 }, br: { x: 0.61, y: 0.353 }, bl: { x: 0.375, y: 0.353 } } },
  } },
  // Tente Arka yüzü — arka açıda görünür.
  { id: "tente-arka", group: "tente", label: { tr: "Tente Arka Yüzü", en: "Awning Back" }, views: {
      "arka":   { quad: { tl: { x: 0.40, y: 0.29 }, tr: { x: 0.575, y: 0.29 }, br: { x: 0.575, y: 0.315 }, bl: { x: 0.40, y: 0.315 } },
                  fullQuad: { tl: { x: 0.375, y: 0.272 }, tr: { x: 0.605, y: 0.272 }, br: { x: 0.605, y: 0.34 }, bl: { x: 0.375, y: 0.34 } } },
  } },
];

/** PLACEHOLDER — her yüzeyin (logo veya giydirme) eklediği fiyat. */
export const SURFACE_PRICE = 60;

/** Bir yüzeye ne uygulandığı: hiçbiri / logo / tam-yüzey giydirme. */
export type SurfaceFill = "yok" | "logo" | "giydirme";

// --------------------------------------------------------------------------
// FİYAT HESABI
// --------------------------------------------------------------------------
export type Selection = Record<CriterionId, string>;

export function computeTotal(
  productId: ConfigProductId,
  selection: Selection,
  surfaces: Record<string, SurfaceFill>,
): number {
  let total = getConfigProduct(productId).basePrice;
  for (const c of CRITERIA) {
    if (!isCriterionActive(c, selection)) continue;
    const opt = getOption(c.id, selection[c.id]);
    if (opt) total += opt.priceDelta;
  }
  for (const s of MOCKUP_SURFACES) {
    const v = surfaces[s.id];
    if (v && v !== "yok") total += SURFACE_PRICE;
  }
  return total;
}

export function formatPrice(amount: number, currency = "$"): string {
  return `${currency}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// --------------------------------------------------------------------------
// RENDER ÇÖZÜMLEME
// Gerçek PNG'ler gelince bu registry'ye `import` ile eklenir:
//   import p100_on_hero from "@/assets/configurator/100-mat_on_hero.png";
//   RENDER_REGISTRY["100-mat_on_hero"] = p100_on_hero;
// Registry'de yoksa şematik SVG placeholder kullanılır.
// --------------------------------------------------------------------------
export const RENDER_REGISTRY: Record<string, string> = {};

export function renderKey(productId: ConfigProductId, angle: AngleId, variant: string): string {
  return `${productId}_${angle}_${variant}`;
}

/** Registry'de gerçek render var mı? */
export function realRender(productId: ConfigProductId, angle: AngleId, variant: string): string | undefined {
  return RENDER_REGISTRY[renderKey(productId, angle, variant)];
}

// --------------------------------------------------------------------------
// UI METİNLERİ (iki dilli) — lokal dosyalarına dokunmamak için burada
// --------------------------------------------------------------------------
export const CONFIG_UI: Record<Locale, {
  title: string;
  material: string;
  mockupTitle: string;
  uploadLogo: string;
  uploadGiydirme: string;
  assetChange: string;
  logoRemove: string;
  labelLogo: string;
  labelGiydirme: string;
  mockupHint: string;
  mockupAngleHint: string;
  uploadFirst: string;
  surfacesGovde: string;
  surfacesTente: string;
  tenteRequired: string;
  customPlaceholder: (label: string) => string;
  notes: string;
  notesPlaceholder: string;
  total: string;
  addToCart: string;
  leadTime: string;
  placeholderNote: string;
  yok: string;
  varText: string;
}> = {
  tr: {
    title: "Arabanı tasarla",
    material: "Malzeme Seçimi (Ürün)",
    mockupTitle: "Mockup — Logo & Giydirme",
    uploadLogo: "Logo yükle (PNG/SVG)",
    uploadGiydirme: "Giydirme görseli yükle (tam yüzey baskı)",
    assetChange: "Değiştir",
    logoRemove: "Kaldır",
    labelLogo: "Logo",
    labelGiydirme: "Giydirme",
    mockupHint:
      "Logo yüzeye ortalı küçük marka olarak, giydirme ise yüzeyin tamamını kaplayan baskı olarak uygulanır. Her yüzeye ayrı seçim yapabilirsin. Önizleme temsilidir; sipariş notuna ve üretime aynen yansır.",
    mockupAngleHint: "Logo/giydirme önizlemesi ön açıda (tente arkası için arka açıda) gösterilir.",
    uploadFirst: "Önce yukarıdan görseli yükle.",
    surfacesGovde: "Gövde Yüzeyleri",
    surfacesTente: "Tente Yüzeyleri",
    tenteRequired: "Tente uygulaması için önce 'Kumaş Tente: Var' seç.",
    customPlaceholder: (label) => `${label} için açıklama (ör. RAL kodu / renk tarifi)`,
    notes: "Ek notlar",
    notesPlaceholder: "Özel istekler, marka talimatları veya ekstralar...",
    total: "Toplam",
    addToCart: "Sepete ekle",
    leadTime: "Üretim genellikle 2–3 hafta sürer. Dünya geneli kargo.",
    placeholderNote: "Gövde + tente rengi önizlemede gösterilir. Metal rengi ve yapısal seçimler siparişe yansır.",
    yok: "Yok",
    varText: "Var",
  },
  en: {
    title: "Design your cart",
    material: "Material Selection (Product)",
    mockupTitle: "Mockup — Logo & Wrap",
    uploadLogo: "Upload logo (PNG/SVG)",
    uploadGiydirme: "Upload wrap image (full-surface print)",
    assetChange: "Change",
    logoRemove: "Remove",
    labelLogo: "Logo",
    labelGiydirme: "Wrap",
    mockupHint:
      "A logo is applied as a small centered mark; a wrap covers the entire surface. You can choose per surface. The preview is indicative; it carries over to the order note and production.",
    mockupAngleHint: "The logo/wrap preview is shown on the front view (back view for the awning back).",
    uploadFirst: "Upload the image above first.",
    surfacesGovde: "Body Surfaces",
    surfacesTente: "Awning Surfaces",
    tenteRequired: "For awning application, first select 'Fabric Awning: Yes'.",
    customPlaceholder: (label) => `Describe your ${label} (e.g. RAL code / color spec)`,
    notes: "Additional notes",
    notesPlaceholder: "Special requests, branding instructions, or extras...",
    total: "Total",
    addToCart: "Add to cart",
    leadTime: "Production usually takes 2–3 weeks. Worldwide shipping.",
    placeholderNote: "Body + awning color is shown in the preview. Metal color and structural options are applied to your order.",
    yok: "None",
    varText: "Yes",
  },
};
