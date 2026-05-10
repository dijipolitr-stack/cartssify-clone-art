import { Link } from "@tanstack/react-router";
import logo from "@/assets/rumicarts-logo.png";
import { useT } from "@/lib/i18n";

/**
 * Site-wide footer with proper navigation columns and legal page links.
 * Mirrors the structure expected on a serious e-commerce site (vs. the older
 * single-row footer) without breaking the minimal aesthetic of the brand.
 */
export function SiteFooter({ topMargin = false }: { topMargin?: boolean }) {
  const t = useT();
  const year = new Date().getFullYear();

  return (
    <footer className={`border-t border-border ${topMargin ? "mt-20" : ""}`}>
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block">
              <img src={logo} alt="Rumicarts" className="h-7 w-auto" />
            </Link>
            <p className="mt-5 text-sm text-muted-foreground leading-relaxed max-w-xs">
              {t.footer.tagline}
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-xs tracking-[0.25em] uppercase text-foreground mb-4">
              {t.footer.shop}
            </h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link to="/products" className="hover:text-foreground transition">
                  {t.nav.products}
                </Link>
              </li>
              <li>
                <Link to="/" hash="features" className="hover:text-foreground transition">
                  {t.nav.features}
                </Link>
              </li>
              <li>
                <Link to="/" hash="contact" className="hover:text-foreground transition">
                  {t.nav.contact}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs tracking-[0.25em] uppercase text-foreground mb-4">
              {t.footer.company}
            </h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link to="/about" className="hover:text-foreground transition">
                  {t.nav.about}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-foreground transition">
                  {t.nav.faq}
                </Link>
              </li>
              <li>
                <Link to="/contact-info" className="hover:text-foreground transition">
                  {t.footer.contactInfo}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs tracking-[0.25em] uppercase text-foreground mb-4">
              {t.footer.legal}
            </h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link to="/privacy" className="hover:text-foreground transition">
                  {t.footer.privacy}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-foreground transition">
                  {t.footer.terms}
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="hover:text-foreground transition">
                  {t.footer.shippingPolicy}
                </Link>
              </li>
              <li>
                <Link to="/refund" className="hover:text-foreground transition">
                  {t.footer.refundPolicy}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="mt-12 md:mt-16 pt-6 border-t border-border flex flex-col md:flex-row justify-between gap-4 text-sm text-muted-foreground">
          <p>{t.footer.copyright(year)}</p>
          <div className="flex gap-6">
            <a
              href="https://instagram.com/rumicarts"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition"
            >
              {t.footer.instagram}
            </a>
            <a
              href="https://pinterest.com/rumicarts"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition"
            >
              {t.footer.pinterest}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
