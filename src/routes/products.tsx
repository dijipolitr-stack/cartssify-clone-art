import { createFileRoute, Link } from "@tanstack/react-router";
import { products } from "@/data/products";
import logo from "@/assets/rumicarts-logo.png";

export const Route = createFileRoute("/products")({
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
          <Link to="/products" className="hover:text-foreground transition" activeProps={{ className: "text-foreground" }}>
            Products
          </Link>
          <Link to="/" hash="features" className="hover:text-foreground transition">Features</Link>
          <Link to="/" hash="contact" className="hover:text-foreground transition">Contact</Link>
        </nav>
        <Link
          to="/products"
          className="text-sm font-medium border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition"
        >
          Shop
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

function ProductsPage() {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Nav />
      <main className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4">
            Collection
          </p>
          <h1 className="text-4xl md:text-6xl font-light tracking-tight">
            All Products
          </h1>
          <p className="mt-6 text-muted-foreground max-w-xl mx-auto">
            Mobile carts, modular bars and display solutions — built for events,
            pop-ups and on-the-go retail.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
          {products.map((p) => (
            <Link
              key={p.slug}
              to="/products/$slug"
              params={{ slug: p.slug }}
              className="group"
            >
              <article>
                <div className="aspect-square overflow-hidden bg-secondary">
                  <img
                    src={p.image}
                    alt={p.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="mt-5">
                  <h2 className="text-base font-medium text-foreground leading-snug group-hover:underline underline-offset-4">
                    {p.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{p.price}</p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
