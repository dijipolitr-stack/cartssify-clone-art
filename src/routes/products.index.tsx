import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { TopBar } from "@/components/TopBar";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { useI18n, useT } from "@/lib/i18n";
import {
  V2_MODELS,
  V2_MODEL_COLORS,
  v2Src,
  pick,
  type Locale,
  type V2Model,
} from "@/data/configurator";

export const Route = createFileRoute("/products/")({
  component: ProductsPage,
  head: () => ({
    meta: [
      { title: "Rumicarts — Örnek Tasarımlar" },
      {
        name: "description",
        content:
          "Rumicarts arabalarını boyut, renk, tente, tekerlek, metal ve yapı filtreleriyle keşfedin.",
      },
      { property: "og:title", content: "Örnek Tasarımlar — Rumicarts" },
      {
        property: "og:description",
        content: "Filtreleyerek istediğiniz araç modelini bulun ve özelleştirin.",
      },
    ],
  }),
});

// Sayfaya özel iki dilli metinler.
const TXT: Record<Locale, {
  eyebrow: string;
  title: string;
  intro: string;
  filters: string;
  boyut: string;
  metal: string;
  yapi: string;
  renk: string;
  tente: string;
  teker: string;
  varT: string;
  yokT: string;
  rafli: string;
  tutamacli: string;
  krom: string;
  pirinc: string;
  clear: string;
  results: (n: number) => string;
  empty: string;
}> = {
  tr: {
    eyebrow: "Koleksiyon",
    title: "Örnek Tasarımlar",
    intro:
      "Tüm renk, boyut, tente, tekerlek, metal ve yapı kombinasyonları burada. Filtreleri kullanarak aradığınız ürünü daraltın ve o ürünün sayfasına gidin.",
    filters: "Filtreler",
    boyut: "Boyut",
    metal: "Metal",
    yapi: "Yapı",
    renk: "Renk",
    tente: "Tente",
    teker: "Dekoratif Teker",
    varT: "Var",
    yokT: "Yok",
    rafli: "Raflı",
    tutamacli: "Tutamaçlı",
    krom: "Krom",
    pirinc: "Pirinç",
    clear: "Filtreleri temizle",
    results: (n) => `${n} ürün`,
    empty: "Seçtiğiniz filtrelere uygun ürün yok. Filtreleri temizleyin.",
  },
  en: {
    eyebrow: "Collection",
    title: "Example Designs",
    intro:
      "Every color, size, awning, wheel, metal and structure combination is here. Use the filters to narrow down the product you have in mind and open its page.",
    filters: "Filters",
    boyut: "Size",
    metal: "Metal",
    yapi: "Structure",
    renk: "Color",
    tente: "Awning",
    teker: "Decorative Wheel",
    varT: "Yes",
    yokT: "None",
    rafli: "With Shelf",
    tutamacli: "With Handle",
    krom: "Chrome",
    pirinc: "Brass",
    clear: "Clear filters",
    results: (n) => (n === 1 ? "1 product" : `${n} products`),
    empty: "No products match your filters. Try clearing them.",
  },
};

// Marka paleti (menü ile aynı: Cloud White + Champagne Gold).
const GOLD = "#B89B5E";
const INK = "#1E1E1E";

// Tüm kombinasyonlar (modül düzeyinde bir kez) — 8 model × 5 renk × 2 tente × 2 teker.
type Combo = {
  key: string;
  model: V2Model;
  colorId: string;
  tenteOn: boolean;
  tekerOn: boolean;
};
const ALL_COMBOS: Combo[] = V2_MODELS.flatMap((model) =>
  V2_MODEL_COLORS.flatMap((c) =>
    [false, true].flatMap((tenteOn) =>
      [true, false].map((tekerOn) => ({
        key: `${model.key}-${c.id}-${tenteOn ? 1 : 0}-${tekerOn ? 1 : 0}`,
        model,
        colorId: c.id,
        tenteOn,
        tekerOn,
      })),
    ),
  ),
);

/** Çoklu-seçim chip grubu — boş küme = "hepsi". */
function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function FacetChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs px-3 py-1.5 rounded-full border transition"
      style={
        active
          ? { background: GOLD, borderColor: GOLD, color: "#fff" }
          : { borderColor: "#D8D4CB", color: "#5F5F5A", background: "transparent" }
      }
    >
      {children}
    </button>
  );
}

function FacetGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium mb-2" style={{ color: INK }}>
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function ProductsPage() {
  useT();
  const { locale } = useI18n();
  const tx = TXT[locale];

  // Tüm filtreler daraltıcı. Boş küme = hepsi.
  const [sizes, setSizes] = useState<Set<string>>(new Set());
  const [metals, setMetals] = useState<Set<string>>(new Set());
  const [yapilar, setYapilar] = useState<Set<string>>(new Set());
  const [colors, setColors] = useState<Set<string>>(new Set());
  const [tentes, setTentes] = useState<Set<string>>(new Set()); // "var" | "yok"
  const [tekers, setTekers] = useState<Set<string>>(new Set()); // "var" | "yok"

  const combos = useMemo(
    () =>
      ALL_COMBOS.filter((x) => {
        if (sizes.size && !sizes.has(x.model.sizeCm)) return false;
        if (metals.size && !metals.has(x.model.metal)) return false;
        if (yapilar.size && !yapilar.has(x.model.yapi)) return false;
        if (colors.size && !colors.has(x.colorId)) return false;
        if (tentes.size && !tentes.has(x.tenteOn ? "var" : "yok")) return false;
        if (tekers.size && !tekers.has(x.tekerOn ? "var" : "yok")) return false;
        return true;
      }),
    [sizes, metals, yapilar, colors, tentes, tekers],
  );

  const anyFilter =
    sizes.size || metals.size || yapilar.size || colors.size || tentes.size || tekers.size;
  const clearAll = () => {
    setSizes(new Set());
    setMetals(new Set());
    setYapilar(new Set());
    setColors(new Set());
    setTentes(new Set());
    setTekers(new Set());
  };

  const colorLabel = (id: string) =>
    pick(V2_MODEL_COLORS.find((c) => c.id === id)!.label, locale);

  return (
    <div className="min-h-screen" style={{ background: "#F7F6F2" }}>
      <TopBar />
      <SiteNav variant="products-list" />
      <main className="max-w-7xl mx-auto px-6 py-14 md:py-20">
        <div className="mb-10 md:mb-14 max-w-2xl">
          <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: GOLD }}>
            {tx.eyebrow}
          </p>
          <h1 className="text-3xl md:text-5xl font-light tracking-tight" style={{ color: INK }}>
            {tx.title}
          </h1>
          <p className="mt-4 text-sm md:text-base" style={{ color: "#5F5F5A" }}>
            {tx.intro}
          </p>
        </div>

        <div className="grid md:grid-cols-[240px_1fr] gap-8 lg:gap-12">
          {/* ---- Filtre paneli ---- */}
          <aside className="md:sticky md:top-24 md:self-start space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium tracking-wide" style={{ color: INK }}>
                {tx.filters}
              </h2>
              {anyFilter ? (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs underline underline-offset-2"
                  style={{ color: "#5F5F5A" }}
                >
                  {tx.clear}
                </button>
              ) : null}
            </div>

            <FacetGroup label={tx.boyut}>
              {[
                { id: "100", label: "100 cm" },
                { id: "150", label: "150 cm" },
              ].map((o) => (
                <FacetChip key={o.id} active={sizes.has(o.id)} onClick={() => setSizes(toggleInSet(sizes, o.id))}>
                  {o.label}
                </FacetChip>
              ))}
            </FacetGroup>

            <FacetGroup label={tx.metal}>
              {[
                { id: "krom", label: tx.krom },
                { id: "pirinc", label: tx.pirinc },
              ].map((o) => (
                <FacetChip key={o.id} active={metals.has(o.id)} onClick={() => setMetals(toggleInSet(metals, o.id))}>
                  {o.label}
                </FacetChip>
              ))}
            </FacetGroup>

            <FacetGroup label={tx.yapi}>
              {[
                { id: "rafli", label: tx.rafli },
                { id: "tutamacli", label: tx.tutamacli },
              ].map((o) => (
                <FacetChip key={o.id} active={yapilar.has(o.id)} onClick={() => setYapilar(toggleInSet(yapilar, o.id))}>
                  {o.label}
                </FacetChip>
              ))}
            </FacetGroup>

            {/* Renk — çoklu seçim swatch */}
            <FacetGroup label={tx.renk}>
              {V2_MODEL_COLORS.map((c) => {
                const on = colors.has(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColors(toggleInSet(colors, c.id))}
                    title={pick(c.label, locale)}
                    aria-label={pick(c.label, locale)}
                    className="h-7 w-7 rounded-full border-2 transition"
                    style={{
                      background: c.hex,
                      borderColor: on ? GOLD : "#D8D4CB",
                      outline: on ? `2px solid ${GOLD}` : "none",
                      outlineOffset: 2,
                    }}
                  />
                );
              })}
            </FacetGroup>

            <FacetGroup label={tx.tente}>
              <FacetChip active={tentes.has("yok")} onClick={() => setTentes(toggleInSet(tentes, "yok"))}>{tx.yokT}</FacetChip>
              <FacetChip active={tentes.has("var")} onClick={() => setTentes(toggleInSet(tentes, "var"))}>{tx.varT}</FacetChip>
            </FacetGroup>

            <FacetGroup label={tx.teker}>
              <FacetChip active={tekers.has("var")} onClick={() => setTekers(toggleInSet(tekers, "var"))}>{tx.varT}</FacetChip>
              <FacetChip active={tekers.has("yok")} onClick={() => setTekers(toggleInSet(tekers, "yok"))}>{tx.yokT}</FacetChip>
            </FacetGroup>
          </aside>

          {/* ---- Grid ---- */}
          <section>
            <p className="text-xs mb-5" style={{ color: "#5F5F5A" }}>
              {tx.results(combos.length)}
            </p>

            {combos.length === 0 ? (
              <p className="text-sm py-16 text-center" style={{ color: "#5F5F5A" }}>
                {tx.empty}
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                {combos.map((x) => {
                  const img = v2Src(
                    x.model.size,
                    x.model.metal,
                    x.model.tutamacRaf,
                    x.colorId,
                    x.tenteOn,
                    1,
                    x.tekerOn,
                  );
                  return (
                    <Link
                      key={x.key}
                      to="/products/$slug"
                      params={{ slug: `model-${x.model.key}` }}
                      search={{ govde: x.colorId, tente: x.tenteOn ? 1 : 0, teker: x.tekerOn ? 1 : 0 }}
                      className="group"
                    >
                      <article>
                        <div
                          className="aspect-square overflow-hidden rounded-lg relative"
                          style={{ background: "#ECE7DD" }}
                        >
                          {img ? (
                            <img
                              src={img}
                              alt={pick(x.model.label, locale)}
                              loading="lazy"
                              className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-[1.04]"
                            />
                          ) : null}
                        </div>
                        <div className="mt-3">
                          <h3 className="text-sm font-medium leading-snug" style={{ color: INK }}>
                            {pick(x.model.label, locale)}
                          </h3>
                          <p className="mt-0.5 text-xs" style={{ color: "#5F5F5A" }}>
                            {colorLabel(x.colorId)} · {x.tenteOn ? tx.tente : tx.yokT} ·{" "}
                            {x.tekerOn ? tx.teker : tx.yokT}
                          </p>
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
      <SiteFooter topMargin />
    </div>
  );
}
