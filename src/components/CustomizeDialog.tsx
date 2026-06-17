import { useCallback, useMemo, useRef, useState, type ChangeEvent } from "react";
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
  type Quad,
  type Selection,
  type SurfaceFill,
} from "@/data/configurator";

type AssetKind = "logo" | "giydirme";
type Asset = { name: string; thumb: string };

// --- Perspektif (homografi) yardımcıları -------------------------------
// Logoyu bir yüzeyin 4 köşesine (quad) yatık oturtmak için, birim kareyi
// hedef dörtgene eşleyen projektif dönüşümü hesaplayıp CSS matrix3d üretir.
// Kaynak <img> kutusu quad'ın yaklaşık en/boyuna göre boyutlandırılır
// (object-fit: contain → logo en-boy oranı korunur), sonra warp edilir.
function unitToQuad(p: {
  x0: number; y0: number; x1: number; y1: number;
  x2: number; y2: number; x3: number; y3: number;
}) {
  const dx1 = p.x1 - p.x2, dx2 = p.x3 - p.x2, sx = p.x0 - p.x1 + p.x2 - p.x3;
  const dy1 = p.y1 - p.y2, dy2 = p.y3 - p.y2, sy = p.y0 - p.y1 + p.y2 - p.y3;
  let a, b, c, d, e, f, g, h;
  if (Math.abs(sx) < 1e-9 && Math.abs(sy) < 1e-9) {
    a = p.x1 - p.x0; b = p.x2 - p.x1; c = p.x0;
    d = p.y1 - p.y0; e = p.y2 - p.y1; f = p.y0;
    g = 0; h = 0;
  } else {
    const den = dx1 * dy2 - dx2 * dy1;
    g = (sx * dy2 - dx2 * sy) / den;
    h = (dx1 * sy - sx * dy1) / den;
    a = p.x1 - p.x0 + g * p.x1;
    b = p.x3 - p.x0 + h * p.x3;
    c = p.x0;
    d = p.y1 - p.y0 + g * p.y1;
    e = p.y3 - p.y0 + h * p.y3;
    f = p.y0;
  }
  return { a, b, c, d, e, f, g, h };
}

function quadWarp(quad: Quad, boxPx: number) {
  const tl = { x: quad.tl.x * boxPx, y: quad.tl.y * boxPx };
  const tr = { x: quad.tr.x * boxPx, y: quad.tr.y * boxPx };
  const br = { x: quad.br.x * boxPx, y: quad.br.y * boxPx };
  const bl = { x: quad.bl.x * boxPx, y: quad.bl.y * boxPx };
  const Wsrc = Math.max(Math.hypot(tr.x - tl.x, tr.y - tl.y), Math.hypot(br.x - bl.x, br.y - bl.y)) || 1;
  const Hsrc = Math.max(Math.hypot(bl.x - tl.x, bl.y - tl.y), Math.hypot(br.x - tr.x, br.y - tr.y)) || 1;
  const m = unitToQuad({
    x0: tl.x, y0: tl.y, x1: tr.x, y1: tr.y,
    x2: br.x, y2: br.y, x3: bl.x, y3: bl.y,
  });
  const mat = [
    m.a / Wsrc, m.d / Wsrc, 0, m.g / Wsrc,
    m.b / Hsrc, m.e / Hsrc, 0, m.h / Hsrc,
    0, 0, 1, 0,
    m.c, m.f, 0, 1,
  ];
  return { transform: `matrix3d(${mat.join(",")})`, Wsrc, Hsrc };
}

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
  // Her yüzeye ne uygulandığı (yok / logo / giydirme) + iki ayrı yüklenen görsel.
  const [surfaces, setSurfaces] = useState<Record<string, SurfaceFill>>({});
  const [assets, setAssets] = useState<Record<AssetKind, Asset | null>>({
    logo: null,
    giydirme: null,
  });
  const [notes, setNotes] = useState("");
  const [angle, setAngle] = useState<AngleId>("on");

  // Önizleme kutusunun piksel boyutu (kare) — logo perspektifini px'e çevirmek için.
  // Callback ref: Radix portal içeriği mount olduğunda kesin çağrılır (useEffect +
  // useRef kombinasyonu portal timing'inde boxRef.current'ı null görüp ölçemiyordu).
  const [boxPx, setBoxPx] = useState(0);
  const roRef = useRef<ResizeObserver | null>(null);
  const measureBox = useCallback((el: HTMLDivElement | null) => {
    roRef.current?.disconnect();
    if (!el) return;
    setBoxPx(el.clientWidth);
    roRef.current = new ResizeObserver(() => setBoxPx(el.clientWidth));
    roRef.current.observe(el);
  }, []);

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
  // Yapısal seçimler GERÇEK render setiyle gösterilir — post-processing (kırpma/
  // maske/CSS filtre) yok. Her eksen dosya adına bir sonek ekler; varsayılan
  // (tekerlek var + tente var) sonek almaz. Sonek SIRASI render dosya adlarıyla
  // birebir eşleşmeli: önce tekerlek, sonra tente.
  //   Dekoratif Tekerlek "Yok" → -tekeryok   (büyük yan tekerlekler olmadan)
  //   Kumaş Tente "Yok"        → -tenteyok    (kumaş tente + direkler olmadan)
  // 5 renk × 6 açı × 2 tekerlek × 2 tente. Caster (alt yürütme) tüm setlerde durur.
  const tekerSuffix = selection.dekoratifTekerlek === "yok" ? "-tekeryok" : "";
  const tenteSuffix = tenteOn ? "" : "-tenteyok";
  const variant = `${tekerSuffix}${tenteSuffix}`;
  // MOCKUP modu: herhangi bir görsel (logo/giydirme) yüklendiğinde önizleme,
  // gövde/tente üzerindeki gömülü RUMICARTS markası SİLİNMİŞ beyaz "-nologo"
  // render'a geçer — kullanıcının görseli temiz, marka çakışması olmayan bir
  // yüzeye biner. Görsel yokken normal renkli/beyaz render gösterilir.
  const hasAsset = !!(assets.logo || assets.giydirme);
  const previewSrc = hasAsset
    ? `/renders/hero-${angle}${variant}-nologo.webp`
    : COLOR_RENDER_IDS.has(colorId)
      ? `/renders/hero-${colorId}-${angle}${variant}.webp`
      : `/renders/hero-${angle}${variant}.webp`;

  // Aktif açıda önizlenecek yüzeyler: yok değil + ilgili görsel yüklü + tente
  // ise tente açık. Her yüzey kendi seçtiği görseli (logo/giydirme) gösterir.
  const activeSurfaces = MOCKUP_SURFACES.filter((s) => {
    const fill = surfaces[s.id];
    return (
      s.views[angle] &&            // bu yüzey aktif açıdan görünüyor mu
      fill && fill !== "yok" &&
      assets[fill] &&
      (s.group !== "tente" || tenteOn)
    );
  });

  // --- Handlers ---------------------------------------------------------
  const choose = (criterion: CriterionId, valueId: string) =>
    setSelection((prev) => ({ ...prev, [criterion]: valueId }));

  const onAssetChange =
    (kind: AssetKind) => (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string")
          setAssets((p) => ({ ...p, [kind]: { name: file.name, thumb: reader.result as string } }));
      };
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
      (s) => surfaces[s.id] && surfaces[s.id] !== "yok" && (s.group !== "tente" || tenteOn),
    );
    if (enabledSurfaces.length) {
      lines.push(
        `${ui.mockupTitle}: ` +
          enabledSurfaces
            .map(
              (s) =>
                `${pick(s.label, locale)} (${surfaces[s.id] === "giydirme" ? ui.labelGiydirme : ui.labelLogo})`,
            )
            .join(", "),
      );
    }
    if (assets.logo) lines.push(`${ui.labelLogo}: ${assets.logo.name}`);
    if (assets.giydirme) lines.push(`${ui.labelGiydirme}: ${assets.giydirme.name}`);
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
      logoFilename: assets.logo?.name ?? assets.giydirme?.name ?? undefined,
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

            {/* Mockup — logo & giydirme */}
            <Section title={ui.mockupTitle}>
              {/* İki ayrı yükleme alanı */}
              <div className="grid grid-cols-2 gap-3">
                <AssetUpload
                  label={ui.uploadLogo}
                  asset={assets.logo}
                  changeText={ui.assetChange}
                  removeText={ui.logoRemove}
                  onChange={onAssetChange("logo")}
                  onRemove={() => setAssets((p) => ({ ...p, logo: null }))}
                />
                <AssetUpload
                  label={ui.uploadGiydirme}
                  asset={assets.giydirme}
                  changeText={ui.assetChange}
                  removeText={ui.logoRemove}
                  onChange={onAssetChange("giydirme")}
                  onRemove={() => setAssets((p) => ({ ...p, giydirme: null }))}
                />
              </div>

              {/* Gövde yüzeyleri */}
              <SurfaceGroup
                heading={ui.surfacesGovde}
                surfaces={MOCKUP_SURFACES.filter((s) => s.group === "govde")}
                state={surfaces}
                assets={assets}
                ui={ui}
                locale={locale}
                onSet={(id, fill) => setSurfaces((p) => ({ ...p, [id]: fill }))}
              />

              {/* Tente yüzeyleri (tente "var" değilse pasif) */}
              <SurfaceGroup
                heading={ui.surfacesTente}
                surfaces={MOCKUP_SURFACES.filter((s) => s.group === "tente")}
                state={surfaces}
                assets={assets}
                ui={ui}
                locale={locale}
                disabled={!tenteOn}
                disabledHint={ui.tenteRequired}
                onSet={(id, fill) => setSurfaces((p) => ({ ...p, [id]: fill }))}
              />

              <p className="mt-3 text-[11px] text-muted-foreground/80 leading-snug">
                {ui.mockupHint}
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
              <div ref={measureBox} className="relative w-full max-w-md aspect-square">
                <img
                  src={previewSrc}
                  alt={`${pick(getConfigProduct(productId).label, locale)} — ${angle}`}
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  onError={(e) => {
                    // Varyant render seti henüz çekilmediyse (örn. -tenteyok) en
                    // yakın mevcut görsele düş: önce tente sonekini, sonra tekerlek
                    // sonekini at. Render eklenince otomatik doğru görsel gelir.
                    const img = e.currentTarget;
                    if (img.src.includes("-nologo")) {
                      img.src = img.src.replace("-nologo", "");
                    } else if (img.src.includes("-tenteyok")) {
                      img.src = img.src.replace("-tenteyok", "");
                    } else if (img.src.includes("-tekeryok")) {
                      img.src = img.src.replace("-tekeryok", "");
                    }
                  }}
                />
                {/* Logo/giydirme overlay'leri — yüzeyin 4 köşesine perspektif
                    (homografi) ile oturur. Logo: ortalı, oranı korunur (contain);
                    giydirme: yüzeyi tam kaplar (cover). Yüklenen görsel sadık
                    görünsün diye normal blend (kırpma/maske yok). */}
                {boxPx > 0 &&
                  activeSurfaces.map((s) => {
                    const fill = surfaces[s.id] as AssetKind;
                    const asset = assets[fill];
                    if (!asset) return null;
                    const view = s.views[angle];
                    if (!view) return null;
                    const isWrap = fill === "giydirme";
                    // Giydirme yüzeyin TAMAMINI (fullQuad) doldurur; logo merkezdeki
                    // küçük alana (quad) ortalı oturur. Aktif açının köşeleri kullanılır.
                    const { transform, Wsrc, Hsrc } = quadWarp(
                      isWrap ? view.fullQuad : view.quad,
                      boxPx,
                    );
                    return (
                      <img
                        key={s.id}
                        src={asset.thumb}
                        alt=""
                        className="absolute top-0 left-0 pointer-events-none"
                        style={{
                          width: `${Wsrc}px`,
                          height: `${Hsrc}px`,
                          objectFit: isWrap ? "fill" : "contain",
                          transformOrigin: "0 0",
                          transform,
                        }}
                      />
                    );
                  })}
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

type Ui = (typeof CONFIG_UI)["tr"];

// İki ayrı yükleme kutusu (logo / giydirme) için ortak bileşen.
function AssetUpload({
  label,
  asset,
  changeText,
  removeText,
  onChange,
  onRemove,
}: {
  label: string;
  asset: Asset | null;
  changeText: string;
  removeText: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col">
      <label className="block border border-dashed border-border px-3 py-3 text-xs text-muted-foreground cursor-pointer hover:border-foreground transition text-center leading-snug">
        {asset ? changeText : label}
        <input type="file" accept="image/*" onChange={onChange} className="hidden" />
      </label>
      {asset && (
        <div className="mt-2 flex items-center gap-2">
          <img
            src={asset.thumb}
            alt=""
            className="h-10 w-10 object-contain border border-border shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-foreground truncate">{asset.name}</p>
            <button onClick={onRemove} className="text-[11px] underline text-muted-foreground">
              {removeText}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SurfaceGroup({
  heading,
  surfaces,
  state,
  assets,
  ui,
  locale,
  disabled,
  disabledHint,
  onSet,
}: {
  heading: string;
  surfaces: typeof MOCKUP_SURFACES;
  state: Record<string, SurfaceFill>;
  assets: Record<AssetKind, Asset | null>;
  ui: Ui;
  locale: "en" | "tr";
  disabled?: boolean;
  disabledHint?: string;
  onSet: (id: string, fill: SurfaceFill) => void;
}) {
  const options: { id: SurfaceFill; label: string }[] = [
    { id: "yok", label: ui.yok },
    { id: "logo", label: ui.labelLogo },
    { id: "giydirme", label: ui.labelGiydirme },
  ];
  return (
    <div className={`mt-5 ${disabled ? "opacity-50" : ""}`}>
      <p className="text-xs font-medium mb-2">{heading}</p>
      {disabled && disabledHint && (
        <p className="text-[11px] text-muted-foreground mb-2">{disabledHint}</p>
      )}
      <div className="space-y-2">
        {surfaces.map((s) => {
          const cur = state[s.id] ?? "yok";
          return (
            <div key={s.id} className="flex items-center justify-between gap-3">
              <span className="text-sm text-foreground/90">{pick(s.label, locale)}</span>
              <div className="flex border border-border">
                {options.map((o) => {
                  // Logo/giydirme seçeneği ilgili görsel yüklü değilse pasif.
                  const needsAsset = o.id !== "yok";
                  const noAsset = needsAsset && !assets[o.id as AssetKind];
                  const off = disabled || noAsset;
                  const active = cur === o.id;
                  return (
                    <button
                      key={o.id}
                      disabled={off}
                      title={noAsset ? ui.uploadFirst : undefined}
                      onClick={() => onSet(s.id, o.id)}
                      className={`px-2.5 py-1.5 text-xs transition disabled:opacity-40 ${
                        active
                          ? o.id === "yok"
                            ? "bg-secondary text-foreground"
                            : "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {o.label}
                    </button>
                  );
                })}
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
