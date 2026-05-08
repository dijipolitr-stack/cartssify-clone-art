import { useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Product } from "@/data/products";
import { useCart } from "@/lib/cart";
import cartMask from "@/assets/cart-12-natural-mask.png";

type Props = {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const THICKNESS = ["12mm", "15mm"] as const;
const MATERIAL_TYPES = ["Laminate", "Plywood", "Solid Wood"] as const;
const COLORS = [
  { name: "Natural", hex: "#d9c4a3" },
  { name: "White", hex: "#f3f1ec" },
  { name: "Black", hex: "#1a1a1a" },
  { name: "Sand", hex: "#c9b08a" },
  { name: "Olive", hex: "#6b6f4a" },
  { name: "Terracotta", hex: "#b85c3c" },
] as const;
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
  const { addItem, openCart } = useCart();
  const [thickness, setThickness] = useState<(typeof THICKNESS)[number]>("12mm");
  const [material, setMaterial] = useState<(typeof MATERIAL_TYPES)[number]>("Laminate");
  const [color, setColor] = useState<(typeof COLORS)[number]["name"]>("Natural");
  const [hardware, setHardware] = useState<(typeof HARDWARE)[number]>("Black");
  const [logo, setLogo] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

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
      title: `${product.title} (${color}, ${material}, ${thickness})`,
    };
    addItem(customized, 1);
    onOpenChange(false);
    openCart();
  };

  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden">
        <div className="grid md:grid-cols-2 max-h-[85vh]">
          {/* Left: options */}
          <div className="p-6 md:p-8 overflow-y-auto">
            <h2 className="text-2xl md:text-3xl font-light tracking-tight">
              Customize your cart
            </h2>

            {/* Thickness */}
            <Section
              title="Material thickness"
              right={<span className="text-muted-foreground">{thickness}</span>}
            >
              <div className="grid grid-cols-2 gap-3">
                {THICKNESS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setThickness(t)}
                    className={`py-3 text-sm border transition ${
                      thickness === t
                        ? "border-foreground bg-secondary"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    {t}
                    {PRICE_DELTA.thickness[t] > 0 && (
                      <span className="text-muted-foreground ml-2 text-xs">
                        +${PRICE_DELTA.thickness[t]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </Section>

            {/* Material */}
            <Section title="Material type">
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value as typeof material)}
                className="w-full border border-border bg-background px-3 py-3 text-sm focus:outline-none focus:border-foreground"
              >
                {MATERIAL_TYPES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                    {PRICE_DELTA.material[m] > 0 ? ` (+$${PRICE_DELTA.material[m]})` : ""}
                  </option>
                ))}
              </select>
            </Section>

            {/* Color */}
            <Section
              title="Color type"
              right={<span className="text-muted-foreground">{color}</span>}
            >
              <div className="flex flex-wrap gap-3">
                {COLORS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setColor(c.name)}
                    title={c.name}
                    className={`h-10 w-10 rounded-full border-2 transition ${
                      color === c.name ? "border-foreground" : "border-border"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    aria-label={c.name}
                  />
                ))}
              </div>
            </Section>

            {/* Hardware */}
            <Section title="Hardware finish">
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
                    {h}
                  </button>
                ))}
              </div>
            </Section>

            {/* Logo upload */}
            <Section title="Custom logo (optional)">
              <label className="block border border-dashed border-border px-3 py-4 text-sm text-muted-foreground cursor-pointer hover:border-foreground transition text-center">
                {logo ? "Change logo" : "Upload your logo (PNG/SVG)"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={onLogoChange}
                  className="hidden"
                />
              </label>
              {logo && (
                <div className="mt-3 flex items-center gap-3">
                  <img src={logo} alt="Logo" className="h-12 w-12 object-contain border border-border" />
                  <button
                    onClick={() => setLogo(null)}
                    className="text-xs underline text-muted-foreground"
                  >
                    Remove
                  </button>
                </div>
              )}
            </Section>

            {/* Notes */}
            <Section title="Special requests (optional)">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Tell us anything else about your cart…"
                className="w-full border border-border bg-background px-3 py-3 text-sm focus:outline-none focus:border-foreground resize-none"
              />
            </Section>
          </div>

          {/* Right: preview */}
          <div className="bg-secondary flex flex-col">
            <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
              <div
                className="relative max-h-[55vh]"
                style={{
                  filter: material === "Solid Wood"
                    ? "contrast(1.05) saturate(1.15)"
                    : material === "Plywood"
                      ? "contrast(1.02) saturate(1.05) sepia(0.08)"
                      : "none",
                  transform: thickness === "15mm" ? "scale(1.03)" : "scale(1)",
                  transition: "transform 300ms ease, filter 300ms ease",
                }}
              >
                <img
                  src={cartMask}
                  alt={product.title}
                  className="max-h-[55vh] w-auto object-contain block"
                />
                {/* Color tint overlay — masked to cart silhouette */}
                {color !== "White" && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundColor: COLORS.find((c) => c.name === color)?.hex,
                      mixBlendMode: "multiply",
                      opacity: color === "Natural" ? 0.55 : 0.85,
                      WebkitMaskImage: `url(${cartMask})`,
                      maskImage: `url(${cartMask})`,
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskSize: "contain",
                      maskSize: "contain",
                      WebkitMaskPosition: "center",
                      maskPosition: "center",
                    }}
                  />
                )}
                {/* Hardware finish hint (small dot on door area) */}
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
                  title={`${hardware} hardware`}
                />
                {logo && (
                  <img
                    src={logo}
                    alt="Your logo"
                    className="absolute h-16 w-16 object-contain"
                    style={{ top: "55%", left: "50%", transform: "translate(-50%, -50%)" }}
                  />
                )}
              </div>
              {/* Active config chip */}
              <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5 justify-center">
                {[color, material, thickness, `${hardware} HW`].map((label) => (
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
                  Total
                </span>
                <span className="text-2xl font-light">
                  {formatPrice(total, base.currency)}
                </span>
              </div>
              <button
                onClick={handleAdd}
                className="w-full bg-foreground text-background py-4 text-sm tracking-[0.25em] uppercase hover:opacity-90 transition"
              >
                Add to cart
              </button>
              <p className="mt-3 text-[11px] text-muted-foreground text-center">
                Production usually takes 2–3 weeks. Worldwide shipping.
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
