import { createFileRoute, Link } from "@tanstack/react-router";
import { products, localizeProduct } from "@/data/products";
import { TopBar } from "@/components/TopBar";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { useI18n, useT } from "@/lib/i18n";

export const Route = createFileRoute("/products/")({
  component: ProductsPage,
  head: () => ({
    meta: [
      { title: "All Products — Rumicarts" },
      {
        name: "description",
        content:
          "Browse all Rumicarts mobile carts, modular bars, and display solutions for events and retail.",
      },
      { property: "og:title", content: "All Products — Rumicarts" },
      {
        property: "og:description",
        content: "Mobile carts and modular display solutions for events and retail.",
      },
    ],
  }),
});

function ProductsPage() {
  const t = useT();
  const { locale } = useI18n();
  // Localize each product to the active locale before rendering. The order is
  // preserved (products array is already sorted: customize-render products first).
  const list = products.map((p) => localizeProduct(p, locale));
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <SiteNav variant="products-list" />
      <main className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4">
            {t.productsList.eyebrow}
          </p>
          <h1 className="text-4xl md:text-6xl font-light tracking-tight">
            {t.productsList.title}
          </h1>
          <p className="mt-6 text-muted-foreground max-w-xl mx-auto">
            {t.productsList.intro}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
          {list.map((p) => (
            <Link
              key={p.slug}
              to="/products/$slug"
              params={{ slug: p.slug }}
              className="group"
            >
              <article>
                <div className="aspect-square overflow-hidden bg-secondary relative">
                  <img
                    src={p.image}
                    alt={p.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  {p.comingSoon && (
                    <span className="absolute top-3 left-3 bg-foreground/90 text-background text-[10px] tracking-[0.25em] uppercase px-2.5 py-1">
                      {t.productsList.comingSoon}
                    </span>
                  )}
                </div>
                <div className="mt-5">
                  <h2 className="text-base font-medium text-foreground leading-snug group-hover:underline underline-offset-4">
                    {p.title}
                  </h2>
                  <p className={`mt-1 text-sm ${p.comingSoon ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
                    {p.comingSoon ? t.productsList.comingSoonHint : p.price}
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter topMargin />
    </div>
  );
}
