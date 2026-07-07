import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getProduct, products, localizeProduct, type Product } from "@/data/products";
import { TopBar } from "@/components/TopBar";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { CustomizeDialog } from "@/components/CustomizeDialog";
import { useCart } from "@/lib/cart";
import { useI18n, useT } from "@/lib/i18n";

export const Route = createFileRoute("/products/$slug")({
  component: ProductDetail,
  notFoundComponent: NotFound,
  loader: ({ params }) => {
    const product = getProduct(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    if (!p) return { meta: [{ title: "Rumicarts — Product" }] };
    return {
      meta: [
        { title: `Rumicarts — ${p.title}` },
        { name: "description", content: p.tagline ?? p.description.slice(0, 150) },
        { property: "og:title", content: `Rumicarts — ${p.title}` },
        { property: "og:description", content: p.tagline ?? p.description.slice(0, 150) },
        { property: "og:image", content: p.image },
        { name: "twitter:image", content: p.image },
      ],
    };
  },
});

function NotFound() {
  const t = useT();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-light">{t.productDetail.notFound}</h1>
      <Link
        to="/products"
        className="mt-6 text-sm tracking-[0.2em] uppercase border-b border-foreground pb-1"
      >
        {t.productDetail.backToProducts}
      </Link>
    </div>
  );
}

function ProductDetail() {
  const loader = Route.useLoaderData() as { product: Product };
  const { locale } = useI18n();
  // Re-localize the loader product on every render so the visible content
  // changes immediately when the user toggles the language switcher.
  const product = localizeProduct(loader.product, locale);
  const t = useT();
  const images = [product.image, ...(product.gallery ?? [])];
  const detailImages = product.detailImages ?? [];
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const { addItem } = useCart();

  // Lightbox açıkken Escape ile kapat + sayfa kaydırmasını kilitle.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lightbox]);

  // Deep-link: /products/<slug>?configure → konfigüratörü doğrudan açar.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("configure") !== null) {
      setCustomizeOpen(true);
    }
  }, []);

  const related = products
    .filter((p) => p.slug !== product.slug)
    .slice(0, 4)
    .map((p) => localizeProduct(p, locale));

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <SiteNav variant="product-detail" />

      <nav className="max-w-7xl mx-auto px-6 pt-8 text-xs tracking-[0.2em] uppercase text-muted-foreground">
        <Link to="/products" className="hover:text-foreground">{t.nav.products}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.title}</span>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 md:py-16">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16">
          {/* Gallery */}
          <div>
            <div className="aspect-square bg-secondary overflow-hidden">
              <img
                src={images[active]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {images.map((src, i) => (
                  <button
                    key={src + i}
                    onClick={() => setActive(i)}
                    className={`aspect-square overflow-hidden bg-secondary border ${
                      active === i ? "border-foreground" : "border-transparent"
                    }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Ürüne özel ek detay görselleri — tıklanınca popup (lightbox) açılır */}
            {detailImages.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {detailImages.map((src) => (
                <button
                  key={src}
                  onClick={() => setLightbox(src)}
                  className="aspect-square overflow-hidden bg-secondary border border-border hover:border-foreground transition cursor-zoom-in"
                  aria-label={t.productDetail.viewImage ?? "View image"}
                >
                  <img
                    src={src}
                    alt={product.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.tagline && (
              <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
                {product.tagline}
              </p>
            )}
            <h1 className="mt-3 text-3xl md:text-5xl font-light tracking-tight leading-tight">
              {product.title}
            </h1>
            <p className="mt-5 text-2xl text-foreground">{product.price}</p>
            <p className="mt-6 text-base text-muted-foreground leading-relaxed">
              {product.description}
            </p>

            <div className="mt-8 flex items-stretch gap-4">
              <div className="flex items-center border border-border">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-4 py-3 text-lg hover:bg-secondary transition"
                  aria-label={t.cart.decrease}
                >
                  −
                </button>
                <span className="px-5 min-w-[2rem] text-center">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="px-4 py-3 text-lg hover:bg-secondary transition"
                  aria-label={t.cart.increase}
                >
                  +
                </button>
              </div>
              <button
                onClick={() => addItem(product, qty)}
                className="flex-1 bg-foreground text-background px-8 py-3 text-sm tracking-[0.25em] uppercase hover:opacity-90 transition"
              >
                {t.productDetail.addToCart}
              </button>
            </div>

            <button
              onClick={() => setCustomizeOpen(true)}
              className="mt-3 w-full border border-foreground text-foreground px-8 py-3 text-sm tracking-[0.25em] uppercase hover:bg-foreground hover:text-background transition"
            >
              {t.productDetail.customize}
            </button>

            <p className="mt-4 text-xs text-muted-foreground">
              Production usually takes 2–3 weeks. Worldwide shipping.
            </p>

            <div className="mt-10 border-t border-border pt-8">
              <h2 className="text-sm tracking-[0.25em] uppercase text-foreground">
                {t.productDetail.features}
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {product.features.map((f) => (
                  <li key={f} className="flex gap-3">
                    <span className="text-foreground">—</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {product.specs && product.specs.length > 0 ? (
              <div className="mt-10 border-t border-border pt-8">
                <h2 className="text-sm tracking-[0.25em] uppercase text-foreground">
                  {t.productDetail.specs}
                </h2>
                <dl className="mt-4 grid grid-cols-2 gap-y-3 text-sm">
                  {product.specs.map((s) => (
                    <div key={s.label} className="contents">
                      <dt className="text-muted-foreground">{s.label}</dt>
                      <dd className="text-foreground">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <div className="mt-10 border-t border-border pt-8">
                <h2 className="text-sm tracking-[0.25em] uppercase text-foreground">
                  {t.productDetail.specs}
                </h2>
                <p className="mt-4 text-sm text-muted-foreground">
                  {t.productDetail.specsComingSoon}
                </p>
                <a
                  href="#contact"
                  className="mt-4 inline-block text-xs tracking-[0.2em] uppercase border-b border-foreground pb-1 hover:opacity-60 transition"
                >
                  {t.productDetail.askForSpecs}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Related */}
        <section className="mt-24 md:mt-32 border-t border-border pt-16">
          <div className="flex items-end justify-between mb-10">
            <h2 className="text-2xl md:text-3xl font-light tracking-tight">
              You might also like
            </h2>
            <Link
              to="/products"
              className="text-xs tracking-[0.25em] uppercase border-b border-foreground pb-1 hover:opacity-60 transition"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
            {related.map((p) => (
              <Link
                key={p.slug}
                to="/products/$slug"
                params={{ slug: p.slug }}
                className="group"
              >
                <div className="aspect-square overflow-hidden bg-secondary">
                  <img
                    src={p.image}
                    alt={p.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
                <h3 className="mt-4 text-sm text-foreground group-hover:underline underline-offset-4">
                  {p.title}
                </h3>
                <p className="text-xs text-muted-foreground">{p.price}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter topMargin />

      <CustomizeDialog
        product={product}
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
      />

      {/* Görsel popup (lightbox) */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 md:p-10"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 flex items-center justify-center text-white/90 hover:text-white text-2xl leading-none"
            aria-label={t.cart.close ?? "Close"}
          >
            ×
          </button>
          <img
            src={lightbox}
            alt={product.title}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
