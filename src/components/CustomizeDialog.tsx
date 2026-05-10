import { useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Product } from "@/data/products";
import { useCart } from "@/lib/cart";
import { useT } from "@/lib/i18n";
// Default render set — used as a fallback when a product hasn't supplied its
// own customizeRenders. Cart 12 is the flagship so its visuals also act as the
// catch-all for older entries.
import cart12Natural from "@/assets/products/cart-12-renders/cart-12-natural.png";
import cart12White from "@/assets/products/cart-12-renders/cart-12-white.png";
import cart12Black from "@/assets/products/cart-12-renders/cart-12-black.png";
import cart12Sand from "@/assets/products/cart-12-renders/cart-12-sand.png";
import cart12Olive from "@/assets/products/cart-12-renders/cart-12-olive.png";
import cart12Terracotta from "@/assets/products/cart-12-renders/cart-12-terracotta.png";

const FALLBACK_RENDERS = {
  Natural: cart12Natural,
  White: cart12White,
  Black: cart12Black,
  Sand: cart12Sand,
  Olive: cart12Olive,
  Terracotta: cart12Terracotta,
} as const;

type Props = {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const THICKNESS = ["12mm", "15mm"] as const;
const MATERIAL_TYPES = ["Laminate", "Plywood", "Solid Wood"] as const;
type ColorName = "Natural" | "White" | "Black" | "Sand" | "Olive" | "Terracotta";
const COLORS: { name: ColorName; hex: string }[] = [
  { name: "Natural",    hex: "#d9c4a3" },
  { name: "White",      hex: "#f3f1ec" },
  { name: "Black",      hex: "#1a1a1a" },
  { name: "Sand",       hex: "#c9b08a" },
  { name: "Olive",      hex: "#6b6f4a" },
  { name: "Terracotta", hex: "#b85c3c" },
];
const HARDWARE = ["Black", "Stainless Steel", "Brass"] as const;

const PRICE_DELTA = {
  thickness: { "12mm": 0, "15mm": 120 },
  material: { Laminate: 0, Plywood: 80, "Solid Wood": 250 },
  hardware: { Black: 0, "Stainless Steel": 60, Brass: 90 },
} as const;

function parseBasePrice(price: string): { amount: number; currency: string } {
  const match = price.match(/([£$€])\s?([\d,]+(?:\.\d+)?)/);
  if (!match) return { amount: 0, currency: "$" };
  return { amount: parseFloat(match[2].replace(/,/g, "")), currency: match[1] };
}

function formatPrice(amount: number, currency: string) {
  return `${currency}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function CustomizeDialog({ product, open, onOpenChange }: Props) {
  const t = useT();
  const td = t.customizeDialog;
  const { addItem, openCart } = useCart();
  const [thickness, setThickness] = useState<(typeof THICKNESS)[number]>("12mm");
  const [material, setMaterial] = useState<(typeof MATERIAL_TYPES)[number]>("Laminate");
  const [color, setColor] = useState<ColorName>("Natural");
  const [hardware, setHardware] = useState<(typeof HARDWARE)[number]>("Black");
  // Customer's logo: we only track that they've supplied it (filename + a small
  // preview thumbnail). The full file isn't shown on the cart preview render —
  // it's collected at order fulfilment time and applied during production.
  const [logoFilename, setLogoFilename] = useState<string | null>(null);
  const [logoThumb, setLogoThumb] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  // Each product can ship its own per-color render set. If it doesn't, we fall
  // back to the Cart 12 visuals so the dialog never shows a broken image.
  const activeRenders = product.customizeRenders ?? FALLBACK_RENDERS;

  const base = useMemo(() => parseBasePrice(product.price), [product.price]);
  const total =
    base.amount +
    PRICE_DELTA.thickness[thickness] +
    PRICE_DELTA.material[material] +
    PRICE_DELTA.hardware[hardware];

  const handleAdd = () => {
    const customized: Product = {
      ...product,
      price: `${formatPrice(total, base.currency)} USD`,
      slug: `${product.slug}--${thickness}-${material}-${color}-${hardware}`.toLowerCase().replace(/\s+/g, "-"),
      // Use the locale-translated names so the cart drawer shows TR users a
      // proper Turkish description instead of an English suffix.
      title: `${product.title} (${td.colors[color]}, ${td.materials[material]}, ${thickness})`,
    };
    // Build the order note: any free-form notes the customer typed, plus a
    // line confirming the uploaded logo filename. Cleaner than having the
    // logo render onto the preview image.
    const noteParts: string[] = [];
    if (notes.trim()) noteParts.push(notes.trim());
    if (logoFilename) noteParts.push(`Logo: ${logoFilename}`);
    const orderNote = noteParts.join("\n\n") || undefined;
    addItem(customized, 1, {
      notes: orderNote,
      logoFilename: logoFilename || undefined,
    });
    onOpenChange(false);
    openCart();
  };

  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFilename(file.name);
    const reader = new FileReader();
    reader.onload = () =>
      setLogoThumb(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden">
        <div className="grid md:grid-cols-2 max-h-[85vh]">
          {/* Left: options */}
          <div className="p-6 md:p-8 overflow-y-auto">
            <h2 className="text-2xl md:text-3xl font-light tracking-tight">
              {td.title}
            </h2>

            {/* Thickness */}
            <Section
              title={td.sections.thickness}
              right={<span className="text-muted-foreground">{thickness}</span>}
            >
              <div className="grid grid-cols-2 gap-3">
                {THICKNESS.map((tk) => (
                  <button
                    key={tk}
                    onClick={() => setThickness(tk)}
                    className={`py-3 text-sm border transition ${
                      thickness === tk
                        ? "border-foreground bg-secondary"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    {tk}
                    {PRICE_DELTA.thickness[tk] > 0 && (
                      <span className="text-muted-foreground ml-2 text-xs">
                        +${PRICE_DELTA.thickness[tk]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </Section>

            {/* Material */}
            <Section title={td.sections.material}>
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value as typeof material)}
                className="w-full border border-border bg-background px-3 py-3 text-sm focus:outline-none focus:border-foreground"
              >
                {MATERIAL_TYPES.map((m) => (
                  <option key={m} value={m}>
                    {td.materials[m]}
                    {PRICE_DELTA.material[m] > 0 ? ` (+$${PRICE_DELTA.material[m]})` : ""}
                  </option>
                ))}
              </select>
            </Section>

            {/* Color */}
            <Section
              title={td.sections.color}
              right={<span className="text-muted-foreground">{td.colors[color]}</span>}
            >
              <div className="flex flex-wrap gap-3">
                {COLORS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setColor(c.name)}
                    title={td.colors[c.name]}
                    className={`h-10 w-10 rounded-full border-2 transition ${
                      color === c.name ? "border-foreground" : "border-border"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    aria-label={td.colors[c.name]}
                  />
                ))}
              </div>
            </Section>

            {/* Hardware */}
            <Section title={td.sections.hardware}>
              <div className="grid grid-cols-3 gap-3">
                {HARDWARE.map((h) => (
                  <button
                    key={h}
                    onClick={() => setHardware(h)}
                    className={`py-3 text-xs border transition ${
                      hardware === h
                        ? "border-foreground bg-secondary"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    {td.hardware[h]}
                  </button>
                ))}
              </div>
            </Section>

            {/* Logo upload */}
            <Section title={td.sections.logo}>
              <label className="block border border-dashed border-border px-3 py-4 text-sm text-muted-foreground cursor-pointer hover:border-foreground transition text-center">
                {logoFilename ? td.logoChange : td.logoUpload}
                <input
                  type="file"
                  accept="image/*"
                  onChange={onLogoChange}
                  className="hidden"
                />
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
                      {td.logoRemove}
                    </button>
                  </div>
                </div>
              )}
              <p className="mt-2 text-[11px] text-muted-foreground/80 leading-snug">
                {td.logoDisclaimer}
              </p>
            </Section>

            {/* Notes */}
            <Section title={td.sections.notes}>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={td.notesPlaceholder}
                className="w-full border border-border bg-background px-3 py-3 text-sm focus:outline-none focus:border-foreground resize-none"
              />
            </Section>
          </div>

          {/* Right: preview */}
          <div className="bg-secondary flex flex-col">
            <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
              <div
                className="relative w-full max-w-md aspect-[1400/871]"
                style={{
                  // Material gives a subtle finish difference: solid wood looks slightly
                  // richer, plywood slightly warmer, laminate is the neutral baseline.
                  filter:
                    material === "Solid Wood"
                      ? "contrast(1.05) saturate(1.10)"
                      : material === "Plywood"
                        ? "contrast(1.02) saturate(1.05) sepia(0.05)"
                        : "none",
                  // Thicker (15 mm) reads as a slightly chunkier silhouette.
                  transform: thickness === "15mm" ? "scale(1.03)" : "scale(1)",
                  transition: "transform 300ms ease, filter 300ms ease",
                }}
              >
                {/*
                  Each colour swatch corresponds to a pre-rendered transparent PNG.
                  Switching colours simply swaps the image source — no CSS
                  blending tricks, so the cart appears uniformly painted in the
                  exact production finish.
                */}
                {COLORS.map((c) => (
                  <img
                    key={c.name}
                    src={activeRenders[c.name]}
                    alt={`${product.title} — ${c.name}`}
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-300"
                    style={{
                      opacity: c.name === color ? 1 : 0,
                    }}
                    // Preload all variants so colour switching is instant after first open
                    loading="eager"
                    decoding="async"
                  />
                ))}
                {/* Hardware finish hint (small dot near the door / handle area) */}
                <div
                  className="absolute h-2.5 w-2.5 rounded-full border border-black/20 shadow"
                  style={{
                    top: "52%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    backgroundColor:
                      hardware === "Brass"
                        ? "#b08a3e"
                        : hardware === "Stainless Steel"
                          ? "#c9ccd1"
                          : "#1a1a1a",
                    transition: "background-color 200ms ease",
                  }}
                  title={`${td.hardware[hardware]} hardware`}
                />
              </div>
              {/* Active config chip */}
              <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5 justify-center">
                {[
                  td.colors[color],
                  td.materials[material],
                  thickness,
                  `${td.hardware[hardware]} ${td.chips.hardwareSuffix}`,
                ].map((label) => (
                  <span
                    key={label}
                    className="text-[10px] tracking-[0.15em] uppercase bg-background/80 backdrop-blur px-2 py-1 border border-border"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-background border-t border-border p-6">
              <div className="flex items-baseline justify-between mb-4">
                <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
                  {td.total}
                </span>
                <span className="text-2xl font-light">
                  {formatPrice(total, base.currency)}
                </span>
              </div>
              <button
                onClick={handleAdd}
                className="w-full bg-foreground text-background py-4 text-sm tracking-[0.25em] uppercase hover:opacity-90 transition"
              >
                {td.addToCart}
              </button>
              <p className="mt-3 text-[11px] text-muted-foreground text-center">
                {td.leadTime}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
