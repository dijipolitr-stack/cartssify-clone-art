import { Link } from "@tanstack/react-router";
import logo from "@/assets/rumicarts-logo.png";
import { CartButton } from "@/components/Cart";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useT } from "@/lib/i18n";

type Variant = "home" | "products-list" | "product-detail";

/**
 * Site-wide header used by every page.
 * Variant controls which nav links appear and the right-side CTA label, but the
 * markup, classes and visual hierarchy are kept identical to the original
 * per-page Nav components so the design stays untouched.
 */
export function SiteNav({ variant }: { variant: Variant }) {
  const t = useT();

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Rumicarts" className="h-7 md:h-8 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {variant === "home" && (
            <>
              <Link to="/products" className="hover:text-foreground transition">
                {t.nav.products}
              </Link>
              <a href="#features" className="hover:text-foreground transition">
                {t.nav.features}
              </a>
              <Link to="/about" className="hover:text-foreground transition">
                {t.nav.about}
              </Link>
              <Link to="/faq" className="hover:text-foreground transition">
                {t.nav.faq}
              </Link>
              <a href="#contact" className="hover:text-foreground transition">
                {t.nav.contact}
              </a>
            </>
          )}
          {variant === "products-list" && (
            <>
              <Link
                to="/products"
                className="hover:text-foreground transition"
                activeProps={{ className: "text-foreground" }}
              >
                {t.nav.products}
              </Link>
              <Link to="/about" className="hover:text-foreground transition">
                {t.nav.about}
              </Link>
              <Link to="/faq" className="hover:text-foreground transition">
                {t.nav.faq}
              </Link>
              <Link to="/" hash="contact" className="hover:text-foreground transition">
                {t.nav.contact}
              </Link>
            </>
          )}
          {variant === "product-detail" && (
            <>
              <Link to="/products" className="hover:text-foreground transition">
                {t.nav.products}
              </Link>
              <Link to="/" className="hover:text-foreground transition">
                {t.nav.home}
              </Link>
              <Link to="/" hash="contact" className="hover:text-foreground transition">
                {t.nav.contact}
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            to="/products"
            className="text-sm font-medium border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition"
          >
            {variant === "home"
              ? t.nav.shopNow
              : variant === "products-list"
                ? t.nav.shop
                : t.nav.allProducts}
          </Link>
          <CartButton />
        </div>
      </div>
    </header>
  );
}
