import { createFileRoute, Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero-cart.jpg";
import customImg from "@/assets/cart-custom.jpg";
import portableImg from "@/assets/cart-portable.jpg";
import rainbowImg from "@/assets/cart-rainbow.jpg";
import logo from "@/assets/rumicarts-logo.png";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Rumicarts — Mobile Cart Solutions for Events & Retail" },
      {
        name: "description",
        content:
          "Mobile carts solutions for events and retail. Custom, portable display carts built to your brand.",
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
          <a href="#products" className="hover:text-foreground transition">Products</a>
          <a href="#features" className="hover:text-foreground transition">Features</a>
          <a href="#about" className="hover:text-foreground transition">About</a>
          <a href="#contact" className="hover:text-foreground transition">Contact</a>
        </nav>
        <a
          href="#products"
          className="text-sm font-medium border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition"
        >
          Get started
        </a>
      </div>
    </header>
  );
}

function CartMark() {
  return (
    <svg viewBox="0 0 40 28" className="w-8 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 6h36M6 6v14h28V6M10 6V3h20v3" strokeLinecap="square" />
      <circle cx="12" cy="24" r="2.5" />
      <circle cx="28" cy="24" r="2.5" />
    </svg>
  );
}

function Hero() {
  return (
    <section className="relative w-full h-[88vh] min-h-[600px] overflow-hidden">
      <img
        src={heroImg}
        alt="Custom display cart on a city street"
        width={1920}
        height={1280}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/40" />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 text-white">
        <div className="border border-white/80 px-10 md:px-20 py-10 md:py-14 max-w-3xl">
          <h1 className="text-4xl md:text-7xl font-light tracking-[0.15em]">
            RUMI<span className="opacity-70">CARTS</span>
          </h1>
          <div className="h-px w-24 bg-white/70 mx-auto my-6" />
          <p className="text-xs md:text-sm tracking-[0.35em] uppercase">
            Mobile Carts Solutions for Events &amp; Retail
          </p>
        </div>
        <a
          href="#products"
          className="mt-10 inline-block bg-white text-foreground px-8 py-3 text-sm tracking-[0.2em] uppercase hover:bg-white/90 transition"
        >
          Get started
        </a>
      </div>
    </section>
  );
}

type FeatureProps = {
  image: string;
  eyebrow: string;
  title: string;
  body: string;
  cta?: string;
  reverse?: boolean;
};

function Feature({ image, eyebrow, title, body, cta, reverse }: FeatureProps) {
  return (
    <section className="py-20 md:py-32 border-t border-border">
      <div
        className={`max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 md:gap-20 items-center ${
          reverse ? "md:[&>div:first-child]:order-2" : ""
        }`}
      >
        <div className="aspect-[4/3] overflow-hidden bg-secondary">
          <img
            src={image}
            alt={title}
            loading="lazy"
            width={1600}
            height={1200}
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.03]"
          />
        </div>
        <div className="max-w-md">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-5">
            {eyebrow}
          </p>
          <h2 className="text-3xl md:text-5xl font-light tracking-tight text-foreground leading-[1.05]">
            {title}
          </h2>
          <p className="mt-6 text-base text-muted-foreground leading-relaxed">
            {body}
          </p>
          {cta && (
            <a
              href="#contact"
              className="mt-8 inline-block text-sm tracking-[0.2em] uppercase border-b border-foreground pb-1 hover:opacity-60 transition"
            >
              {cta}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const items = [
    { k: "500+", v: "Carts delivered" },
    { k: "40+", v: "Countries shipped" },
    { k: "100%", v: "Customizable" },
    { k: "24/7", v: "Customer care" },
  ];
  return (
    <section className="bg-foreground text-background py-20">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {items.map((i) => (
          <div key={i.v}>
            <div className="text-4xl md:text-5xl font-light">{i.k}</div>
            <div className="mt-2 text-xs tracking-[0.25em] uppercase text-background/60">
              {i.v}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="contact" className="py-28 md:py-40 text-center px-6">
      <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
        Ready when you are
      </p>
      <h2 className="mt-6 text-4xl md:text-6xl font-light tracking-tight max-w-3xl mx-auto leading-tight">
        Build a cart that moves with your brand.
      </h2>
      <a
        href="#"
        className="mt-10 inline-block bg-foreground text-background px-10 py-4 text-sm tracking-[0.25em] uppercase hover:opacity-90 transition"
      >
        Start building
      </a>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 text-foreground">
          <CartMark />
          <span className="font-semibold">cartify</span>
        </div>
        <p>© {new Date().getFullYear()} Cartify. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-foreground">Instagram</a>
          <a href="#" className="hover:text-foreground">Pinterest</a>
          <a href="#" className="hover:text-foreground">Contact</a>
        </div>
      </div>
    </footer>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Nav />
      <main id="products">
        <Hero />
        <Feature
          image={customImg}
          eyebrow="01 — Customize"
          title="Design your custom display cart."
          body="Bring your vision to life. Choose colors, materials and finishes with our easy builder and create a cart that perfectly matches your brand."
          cta="Start building"
        />
        <Feature
          image={portableImg}
          eyebrow="02 — Portable"
          title="Designed for durability & portability."
          body="When the event is over, fold your cart into a compact, flat-pack form. Smooth wheels make moving to the next venue effortless."
          cta="Learn more"
          reverse
        />
        <Feature
          image={rainbowImg}
          eyebrow="03 — Iconic"
          title="A canvas for unforgettable brands."
          body="From minimalist whites to bold rainbow finishes, our carts become a centerpiece — an experience customers remember."
          cta="See gallery"
        />
        <Stats />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
