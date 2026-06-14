import { useMemo, useState, type ChangeEvent } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Product } from "@/data/products";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import {
  ANGLES,
  CONFIG_PRODUCTS,
  CONFIG_UI,
  CRITERIA,
  MOCKUP_SURFACES,
  computeTotal,
  defaultSelection,
  formatPrice,
  getConfigProduct,
  getConfigProductBySlug,
  getOption,
  isCriterionActive,
  pick,
  type AngleId,
  type ConfigProductId,
  type CriterionId,
  type Selection,
} from "@/data/configurator";

type Props = {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Gerçek renkli render seti olan gövde renkleri (beyaz fabrika render'ı + bu 4).
// "ozel" ve hex'siz seçimlerde fabrika beyazı gösterilir.
const COLOR_RENDER_IDS = new Set(["siyah", "yesil", "mavi", "kirmizi"]);

export function CustomizeDialog({ product, open, onOpenChange }: Props) {
  const { locale } = useI18n();
  const ui = CONFIG_UI[locale];

  // Açan ürün 4 konfigüre edilebilir üründen biriyse onu önseç; değilse ilki.
  const initialProductId =
    getConfigProductBySlug(product.slug)?.id ?? CONFIG_PRODUCTS[0].id;

  const [productId, setProductId] = useState<ConfigProductId>(initialProductId);
  const [selection, setSelection] = useState<Selection>(() => defaultSelection());
  const [customText, setCustomText] = useState<Partial<Record<CriterionId, string>>>({});
  const [surfaces, setSurfaces] = useState<Record<string, boolean>>({});
  const [logoFilename, setLogoFilename] = useState<string | null>(null);
  const [logoThumb, setLogoThumb] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [angle, setAngle] = useState<AngleId>("on");

  const { addItem, openCart } = useCart();

  const tenteOn = selection.kumasTente === "var";

  const total = useMemo(
    () => computeTotal(productId, selection, surfaces),
    [productId, selection, surfaces],
  );

  // --- Önizleme görseli -------------------------------------------------
  // Gövde rengine göre GERÇEK renkli V-Ray render'ı (beyaz + siyah/yeşil/mavi/
  // kırmızı, 6 açı). Gövde ve tente tek materyal olduğu için bu render'larda
  // ikisi birlikte renklidir. Metal rengi ve yapısal seçimler (tente var/yok,
  // raf, arka kapak, tekerlek) render'da sabittir; sipariş notuna + seçim
  // panelindeki etikete yansır.
  const colorId = selection.govdeRengi;
  const previewSrc = COLOR_RENDER_IDS.has(colorId)
    ? `/renders/hero-${colorId}-${angle}.webp`
    : `/renders/hero-${angle}.webp`;

  // Mat/Lake farkı: gerçek render tek set olduğu için malzeme hissini sadece
  // renk derinliğiyle veririz (eklenen ışık/hüzme YOK — yapay duruyordu).
  // Lake = daha doygun/kontrastlı/derin (vernik), Mat = daha düz/mat.
  const isLake = getConfigProduct(productId).finish === "lake";
  const previewFilter = isLake
    ? "saturate(1.16) contrast(1.1) brightness(0.99)"
    : "saturate(0.9) contrast(0.96) brightness(1.04)";

  // Kumaş Tente "Yok": üst yapıyı (kumaş tente + taşıyıcı direkler) önizlemeden
  // gizle. Gerçek render tek konfigürasyon olduğu için, geometriyi takip eden
  // hazır "gövde maskesi" (mask-notente-{açı}.png) ile yalnız kutu+tekerlek
  // gösterilir — kutu/tezgah üstü tam kalır, kırpılmaz. Maske geometri olduğundan
  // tüm renklerde ortaktır.
  const tenteCutMask = !tenteOn
    ? `url(/renders/mask-notente-${angle}.png)`
    : undefined;

  // Aktif açıda gösterilecek logo overlay'leri.
  const activeLogoSurfaces = MOCKUP_SURFACES.filter(
    (s) =>
      s.angle === angle &&
      surfaces[s.id] &&
      logoThumb &&
      (s.group !== "tente" || tenteOn),
  );

  // --- Handlers ---------------------------------------------------------
  const choose = (criterion: CriterionId, valueId: string) =>
    setSelection((prev) => ({ ...prev, [criterion]: valueId }));

  const onLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFilename(file.name);
    const reader = new FileReader();
    reader.onload = () =>
      setLogoThumb(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const handleAdd = () => {
    const cp = getConfigProduct(productId);

    // Sipariş notu — placeholder fiyat/önizleme döneminde tam konfigürasyonu
    // metne dökerek üretim için kaybolmamasını garanti eder.
    const lines: string[] = [];
    lines.push(`${ui.material}: ${pick(cp.label, locale)}`);
    for (const c of CRITERIA) {
      if (!isCriterionActive(c, selection)) continue;
      const opt = getOption(c.id, selection[c.id]);
      if (!opt) continue;
      let val = pick(opt.label, locale);
      if (opt.isCustom && customText[c.id]?.trim()) {
        val += ` — ${customText[c.id]!.trim()}`;
      }
      lines.push(`${pick(c.label, locale)}: ${val}`);
    }
    const enabledSurfaces = MOCKUP_SURFACES.filter(
      (s) => surfaces[s.id] && (s.group !== "tente" || tenteOn),
    );
    if (enabledSurfaces.length) {
      lines.push(
        `${ui.mockupTitle}: ` +
          enabledSurfaces.map((s) => pick(s.label, locale)).join(", "),
      );
    }
    if (logoFilename) lines.push(`Logo: ${logoFilename}`);
    if (notes.trim()) lines.push(`\n${notes.trim()}`);

    const customized: Product = {
      ...product,
      slug: `${cp.slug}--${Object.values(selection).join("-")}`.toLowerCase(),
      title: `${pick(cp.label, locale)} — ${pick(getOption("govdeRengi", selection.govdeRengi)!.label, locale)}`,
      price: `${formatPrice(total)} USD`,
      image: previewSrc,
      description: pick(cp.label, locale),
      features: [],
    };

    addItem(customized, 1, {
      notes: lines.join("\n"),
      logoFilename: logoFilename || undefined,
    });
    onOpenChange(false);
    openCart();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden">
        <div className="grid md:grid-cols-2 max-h-[88vh]">
          {/* ---- Sol: seçenekler ---- */}
          <div className="p-6 md:p-8 overflow-y-auto">
            <h2 className="text-2xl md:text-3xl font-light tracking-tight">
              {ui.title}
            </h2>

            {/* Malzeme Seçimi (Ürün) */}
            <Section title={ui.material}>
              <div className="grid grid-cols-2 gap-3">
                {CONFIG_PRODUCTS.map((cp) => (
                  <button
                    key={cp.id}
                    onClick={() => setProductId(cp.id)}
                    className={`py-3 px-2 text-xs border transition text-center ${
                      productId === cp.id
                        ? "border-foreground bg-secondary"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    {pick(cp.label, locale)}
                  </button>
                ))}
              </div>
            </Section>

            {/* 7 kriter */}
            {CRITERIA.map((c) => {
              if (!isCriterionActive(c, selection)) return null;
              const selectedId = selection[c.id];
              const selectedOpt = getOption(c.id, selectedId);
              const showCustom = selectedOpt?.isCustom;
              return (
                <Section
                  key={c.id}
                  title={pick(c.label, locale)}
                  right={
                    selectedOpt ? (
                      <span className="text-muted-foreground">
                        {pick(selectedOpt.label, locale)}
                      </span>
                    ) : undefined
                  }
                >
                  {c.control === "swatch" ? (
                    <div className="flex flex-wrap gap-3">
                      {c.values.map((v) => {
                        const active = v.id === selectedId;
                        return (
                          <button
                            key={v.id}
                            onClick={() => choose(c.id, v.id)}
                            title={pick(v.label, locale)}
                            aria-label={pick(v.label, locale)}
                            className={`h-10 w-10 rounded-full border-2 transition flex items-center justify-center text-[11px] ${
                              active ? "border-foreground" : "border-border"
                            }`}
                            style={
                              v.hex
                                ? { backgroundColor: v.hex }
                                : {
                                    backgroundImage:
                                      "repeating-linear-gradient(45deg,#ddd,#ddd 4px,#f3f1ec 4px,#f3f1ec 8px)",
                                  }
                            }
                          >
                            {v.isCustom && <span className="text-foreground/70">+</span>}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      className={`grid gap-3 ${c.values.length > 2 ? "grid-cols-3" : "grid-cols-2"}`}
                    >
                      {c.values.map((v) => {
                        const active = v.id === selectedId;
                        return (
                          <button
                            key={v.id}
                            onClick={() => choose(c.id, v.id)}
                            className={`py-3 text-sm border transition ${
                              active
                                ? "border-foreground bg-secondary"
                                : "border-border hover:border-foreground"
                            }`}
                          >
                            {pick(v.label, locale)}
                            {v.priceDelta > 0 && (
                              <span className="text-muted-foreground ml-1.5 text-xs">
                                +${v.priceDelta}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* "Özel" → serbest metin */}
                  {showCustom && (
                    <input
                      type="text"
                      value={customText[c.id] ?? ""}
                      onChange={(e) =>
                        setCustomText((prev) => ({ ...prev, [c.id]: e.target.value }))
                      }
                      placeholder={ui.customPlaceholder(pick(c.label, locale))}
                      className="mt-3 w-full border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-foreground"
                    />
                  )}
                </Section>
              );
            })}

            {/* Mockup — logo */}
            <Section title={ui.mockupTitle}>
              <label className="block border border-dashed border-border px-3 py-4 text-sm text-muted-foreground cursor-pointer hover:border-foreground transition text-center">
                {logoFilename ? ui.logoChange : ui.logoUpload}
                <input type="file" accept="image/*" onChange={onLogoChange} className="hidden" />
              </label>
              {logoFilename && (
                <div className="mt-3 flex items-center gap-3">
                  {logoThumb && (
                    <img
                      src={logoThumb}
                      alt="Logo"
                      className="h-12 w-12 object-contain border border-border"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{logoFilename}</p>
                    <button
                      onClick={() => {
                        setLogoFilename(null);
                        setLogoThumb(null);
                      }}
                      className="text-xs underline text-muted-foreground"
                    >
                      {ui.logoRemove}
                    </button>
                  </div>
                </div>
              )}

              {/* Gövde — folyo yüzeyleri */}
              <SurfaceGroup
                heading={ui.surfacesGovde}
                surfaces={MOCKUP_SURFACES.filter((s) => s.group === "govde")}
                state={surfaces}
                locale={locale}
                yok={ui.yok}
                varText={ui.varText}
                onToggle={(id, val) => setSurfaces((p) => ({ ...p, [id]: val }))}
              />

              {/* Tente — baskı yüzeyleri (tente "var" değilse pasif) */}
              <SurfaceGroup
                heading={ui.surfacesTente}
                surfaces={MOCKUP_SURFACES.filter((s) => s.group === "tente")}
                state={surfaces}
                locale={locale}
                yok={ui.yok}
                varText={ui.varText}
                disabled={!tenteOn}
                disabledHint={ui.tenteRequired}
                onToggle={(id, val) => setSurfaces((p) => ({ ...p, [id]: val }))}
              />

              <p className="mt-3 text-[11px] text-muted-foreground/80 leading-snug">
                {ui.logoHint}
              </p>
            </Section>

            {/* Notlar */}
            <Section title={ui.notes}>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={ui.notesPlaceholder}
                className="w-full border border-border bg-background px-3 py-3 text-sm focus:outline-none focus:border-foreground resize-none"
              />
            </Section>
          </div>

          {/* ---- Sağ: önizleme ---- */}
          <div className="bg-secondary flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden min-h-[320px]">
              <div className="relative w-full max-w-md aspect-square">
                <img
                  src={previewSrc}
                  alt={`${pick(getConfigProduct(productId).label, locale)} — ${angle}`}
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-[filter] duration-300"
                  style={{
                    filter: previewFilter,
                    WebkitMaskImage: tenteCutMask,
                    maskImage: tenteCutMask,
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                  }}
                />
                {/* Logo overlay'leri */}
                {activeLogoSurfaces.map((s) => (
                  <img
                    key={s.id}
                    src={logoThumb!}
                    alt=""
                    className="absolute object-contain pointer-events-none"
                    style={{
                      left: `${s.rect.x * 100}%`,
                      top: `${s.rect.y * 100}%`,
                      width: `${s.rect.w * 100}%`,
                      height: `${s.rect.h * 100}%`,
                    }}
                  />
                ))}
              </div>

              {/* Açı seçici */}
              <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
                {ANGLES.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAngle(a.id)}
                    className={`text-[10px] tracking-[0.1em] uppercase px-2 py-1 border transition ${
                      angle === a.id
                        ? "border-foreground bg-background"
                        : "border-border bg-background/60 hover:border-foreground"
                    }`}
                  >
                    {pick(a.label, locale)}
                  </button>
                ))}
              </div>

              <p className="mt-3 text-[10px] text-muted-foreground/70 text-center">
                {ui.placeholderNote}
              </p>
            </div>

            <div className="bg-background border-t border-border p-6">
              <div className="flex items-baseline justify-between mb-4">
                <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
                  {ui.total}
                </span>
                <span className="text-2xl font-light">{formatPrice(total)}</span>
              </div>
              <button
                onClick={handleAdd}
                className="w-full bg-foreground text-background py-4 text-sm tracking-[0.25em] uppercase hover:opacity-90 transition"
              >
                {ui.addToCart}
              </button>
              <p className="mt-3 text-[11px] text-muted-foreground text-center">
                {ui.leadTime}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SurfaceGroup({
  heading,
  surfaces,
  state,
  locale,
  yok,
  varText,
  disabled,
  disabledHint,
  onToggle,
}: {
  heading: string;
  surfaces: typeof MOCKUP_SURFACES;
  state: Record<string, boolean>;
  locale: "en" | "tr";
  yok: string;
  varText: string;
  disabled?: boolean;
  disabledHint?: string;
  onToggle: (id: string, val: boolean) => void;
}) {
  return (
    <div className={`mt-5 ${disabled ? "opacity-50" : ""}`}>
      <p className="text-xs font-medium mb-2">{heading}</p>
      {disabled && disabledHint && (
        <p className="text-[11px] text-muted-foreground mb-2">{disabledHint}</p>
      )}
      <div className="space-y-2">
        {surfaces.map((s) => {
          const on = !!state[s.id];
          return (
            <div key={s.id} className="flex items-center justify-between gap-3">
              <span className="text-sm text-foreground/90">{pick(s.label, locale)}</span>
              <div className="flex border border-border">
                <button
                  disabled={disabled}
                  onClick={() => onToggle(s.id, false)}
                  className={`px-3 py-1.5 text-xs transition ${
                    !on ? "bg-secondary text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {yok}
                </button>
                <button
                  disabled={disabled}
                  onClick={() => onToggle(s.id, true)}
                  className={`px-3 py-1.5 text-xs transition ${
                    on ? "bg-foreground text-background" : "text-muted-foreground"
                  }`}
                >
                  {varText}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-8 border-t border-border pt-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">{title}</h3>
        {right && <div className="text-sm">{right}</div>}
      </div>
      {children}
    </div>
  );
}
