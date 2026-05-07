import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { getProduct, products, type Product } from "@/data/products";
import logo from "@/assets/rumicarts-logo.png";
import { CartButton } from "@/components/Cart";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/products/$slug")({
  component: ProductDetail,
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-light">Product not found</h1>
      <Link
        to="/products"
        className="mt-6 text-sm tracking-[0.2em] uppercase border-b border-foreground pb-1"
      >
        Back to products
      </Link>
    </div>
  ),
  loader: ({ params }) => {
    const product = getProduct(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    if (!p) return { meta: [{ title: "Product — Rumicarts" }] };
    return {
      meta: [
        { title: `${p.title} — Rumicarts` },
        { name: "description", content: p.tagline ?? p.description.slice(0, 150) },
        { property: "og:title", content: `${p.title} — Rumicarts` },
        { property: "og:description", content: p.tagline ?? p.description.slice(0, 150) },
        { property: "og:image", content: p.image },
        { name: "twitter:image", content: p.image },
      ],
    };
  },
});

function TopBar() {
  return (
    <div className="w-full bg-foreground text-background text-xs tracking-[0.2em] uppercase py-2 text-center">
      Worldwide Shipping
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Rumicarts" className="h-7 md:h-8 w-auto" />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <Link to="/products" className="hover:text-foreground transition">Products</Link>
          <Link to="/" className="hover:text-foreground transition">Home</Link>
        </nav>
        <Link
          to="/products"
          className="text-sm font-medium border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition"
        >
          All products
        </Link>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-12 px-6 mt-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 text-foreground">
          <img src={logo} alt="Rumicarts" className="h-6 w-auto" />
        </div>
        <p>© {new Date().getFullYear()} Rumicarts. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-foreground">Instagram</a>
          <a href="#" className="hover:text-foreground">Pinterest</a>
          <a href="#" className="hover:text-foreground">Contact</a>
        </div>
      </div>
    </footer>
  );
}

function ProductDetail() {
  const { product } = Route.useLoaderData() as { product: Product };
  const images = [product.image, ...(product.gallery ?? [])];
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);

  const related = products.filter((p) => p.slug !== product.slug).slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Nav />

      <nav className="max-w-7xl mx-auto px-6 pt-8 text-xs tracking-[0.2em] uppercase text-muted-foreground">
        <Link to="/products" className="hover:text-foreground">Products</Link>
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
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="px-5 min-w-[2rem] text-center">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="px-4 py-3 text-lg hover:bg-secondary transition"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <button className="flex-1 bg-foreground text-background px-8 py-3 text-sm tracking-[0.25em] uppercase hover:opacity-90 transition">
                Add to cart
              </button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Production usually takes 2–3 weeks. Worldwide shipping.
            </p>

            <div className="mt-10 border-t border-border pt-8">
              <h2 className="text-sm tracking-[0.25em] uppercase text-foreground">
                Key features
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

            {product.specs && product.specs.length > 0 && (
              <div className="mt-10 border-t border-border pt-8">
                <h2 className="text-sm tracking-[0.25em] uppercase text-foreground">
                  Specifications
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

      <Footer />
    </div>
  );
}
