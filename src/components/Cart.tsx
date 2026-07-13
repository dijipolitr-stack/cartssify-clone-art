import { Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { useT } from "@/lib/i18n";

export function CartButton() {
  const { count, openCart } = useCart();
  const t = useT();
  return (
    <button
      onClick={openCart}
      aria-label={t.cart.title}
      className="relative inline-flex items-center justify-center w-10 h-10 hover:opacity-70 transition"
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 5h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.5L21 8H6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="20" r="1.2" />
        <circle cx="18" cy="20" r="1.2" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-foreground text-background text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-medium">
          {count}
        </span>
      )}
    </button>
  );
}

function parsePrice(s: string): number {
  const m = s.replace(/,/g, "").match(/([\d.]+)/);
  return m ? parseFloat(m[1]) : 0;
}

export function CartDrawer() {
  const { items, isOpen, closeCart, setQty, removeItem } = useCart();
  const t = useT();
  const subtotal = items.reduce((s, i) => s + parsePrice(i.price) * i.qty, 0);

  return (
    <>
      <div
        onClick={closeCart}
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-background z-50 shadow-xl flex flex-col transition-transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        <header className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="text-xs tracking-[0.3em] uppercase">{t.cart.title}</h2>
          <button onClick={closeCart} aria-label={t.cart.close} className="text-2xl leading-none">
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6 text-muted-foreground">
              <p className="text-sm">{t.cart.empty}</p>
              <Link
                to="/products"
                onClick={closeCart}
                className="mt-6 text-xs tracking-[0.25em] uppercase border-b border-foreground pb-1 text-foreground"
              >
                {t.cart.browse}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.slug} className="flex gap-4 px-6 py-5">
                  <div className="w-20 h-20 bg-secondary overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to="/products/$slug"
                      params={{ slug: item.slug }}
                      search={{}}
                      onClick={closeCart}
                      className="text-sm font-medium leading-snug hover:underline"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">{item.price}</p>
                    {/* Order notes set in the Customize dialog (logo filename, special requests) */}
                    {item.notes && (
                      <p className="mt-2 text-[11px] text-muted-foreground bg-secondary border-l-2 border-border pl-2 py-1.5 whitespace-pre-line leading-relaxed">
                        {item.notes}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center border border-border">
                        <button
                          onClick={() => setQty(item.slug, item.qty - 1)}
                          className="px-2 py-1 text-sm hover:bg-secondary"
                          aria-label={t.cart.decrease}
                        >
                          −
                        </button>
                        <span className="px-3 text-sm min-w-[1.5rem] text-center">{item.qty}</span>
                        <button
                          onClick={() => setQty(item.slug, item.qty + 1)}
                          className="px-2 py-1 text-sm hover:bg-secondary"
                          aria-label={t.cart.increase}
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.slug)}
                        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                      >
                        {t.cart.remove}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-border px-6 py-5 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="tracking-[0.2em] uppercase text-muted-foreground">{t.cart.subtotal}</span>
              <span className="font-medium">
                ${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t.cart.shippingNote}
            </p>
            <button className="w-full bg-foreground text-background py-3 text-sm tracking-[0.25em] uppercase hover:opacity-90 transition">
              {t.cart.checkout}
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}
