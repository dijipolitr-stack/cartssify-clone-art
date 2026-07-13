import { Link } from "@tanstack/react-router";
import logo from "@/assets/rumicarts-logo.png";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useT } from "@/lib/i18n";

type Variant = "home" | "products-list" | "product-detail";

// Marka sunumundaki (Cloud White + Champagne Gold) menü. Tek tip, tüm sayfalarda aynı.
// Seçili öğe altında gold çizgi. Satış modeli TEKLİF olduğu için sepet ikonu YOK.
const LINK =
  "text-sm text-[#5F5F5A] hover:text-[#1E1E1E] transition pb-1 border-b-2 border-transparent";
const LINK_ACTIVE = "text-[#1E1E1E] border-[#B89B5E]";

export function SiteNav(_props: { variant?: Variant }) {
  const t = useT();

  return (
    <header className="sticky top-0 z-30 bg-[#F7F6F2]/90 backdrop-blur border-b border-[#E6E3DD]">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logo} alt="Rumicarts" className="h-7 md:h-8 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          <Link to="/" activeOptions={{ exact: true }} className={LINK} activeProps={{ className: LINK_ACTIVE }}>
            {t.nav.home}
          </Link>
          <Link to="/products" className={LINK} activeProps={{ className: LINK_ACTIVE }}>
            {t.nav.hemenTasarla}
          </Link>
          <Link to="/products" className={LINK}>
            {t.nav.ornekTasarimlar}
          </Link>
          <Link to="/about" className={LINK} activeProps={{ className: LINK_ACTIVE }}>
            {t.nav.about}
          </Link>
          <Link to="/contact-info" className={LINK} activeProps={{ className: LINK_ACTIVE }}>
            {t.nav.contact}
          </Link>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <LanguageSwitcher />
          <Link
            to="/products"
            className="hidden sm:inline-flex items-center gap-2 text-xs font-medium tracking-[0.12em] uppercase text-[#1E1E1E] border border-[#B89B5E] rounded-md px-4 py-2.5 hover:bg-[#B89B5E] hover:text-white transition"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            {t.nav.hemenTasarla}
          </Link>
        </div>
      </div>
    </header>
  );
}
