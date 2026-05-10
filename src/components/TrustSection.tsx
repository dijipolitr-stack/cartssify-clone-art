import { useT } from "@/lib/i18n";

/**
 * Trust strip — visually mirrors the original "Stats" section (dark band, 4
 * columns, large display number on top, uppercase caption below) but without
 * fabricated metrics. Use this for a brand-new maker until real numbers exist.
 *
 * If/when you have real numbers (carts shipped, countries reached, etc.) you
 * can swap this back to a numeric stats grid using the same layout.
 */
export function TrustSection() {
  const t = useT();
  return (
    <section className="bg-foreground text-background py-20">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {t.trust.items.map((item) => (
          <div key={item.v}>
            <div className="text-3xl md:text-4xl font-light tracking-tight">
              {item.k}
            </div>
            <div className="mt-2 text-xs tracking-[0.25em] uppercase text-background/60">
              {item.v}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
