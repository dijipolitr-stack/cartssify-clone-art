import coffeeImg from "@/assets/lifestyle/use-case-coffee-popup.png";
import retailImg from "@/assets/lifestyle/use-case-retail-display.png";
import { useT } from "@/lib/i18n";

/**
 * Use Cases section — lifestyle / context shots showing carts in real
 * scenarios. Sits between the Feature blocks and About to bridge "what's
 * possible with this cart" → "who builds it".
 *
 * Two cards on desktop, stacked on mobile. Equipment shown in photos is for
 * scenario context only and is sold separately — disclaimer line below the grid.
 */
export function UseCasesSection() {
  const t = useT();

  const cases = [
    {
      image: coffeeImg,
      eyebrow: t.useCases.coffee.eyebrow,
      title: t.useCases.coffee.title,
      body: t.useCases.coffee.body,
    },
    {
      image: retailImg,
      eyebrow: t.useCases.retail.eyebrow,
      title: t.useCases.retail.title,
      body: t.useCases.retail.body,
    },
  ];

  return (
    <section className="py-20 md:py-32 border-t border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14 md:mb-20">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
            {t.useCases.eyebrow}
          </p>
          <h2 className="mt-5 text-3xl md:text-5xl font-light tracking-tight leading-[1.05]">
            {t.useCases.title}
          </h2>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed">
            {t.useCases.body}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-10">
          {cases.map((c) => (
            <article key={c.title} className="group">
              <div className="aspect-[4/3] overflow-hidden bg-secondary">
                <img
                  src={c.image}
                  alt={c.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
              <div className="mt-6">
                <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground">
                  {c.eyebrow}
                </p>
                <h3 className="mt-3 text-2xl md:text-3xl font-light tracking-tight">
                  {c.title}
                </h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-md">
                  {c.body}
                </p>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-10 text-xs text-muted-foreground/80 text-center">
          {t.useCases.disclaimer}
        </p>
      </div>
    </section>
  );
}
