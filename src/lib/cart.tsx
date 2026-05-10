import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/data/products";

export type CartItem = {
  slug: string;
  title: string;
  price: string;
  image: string;
  qty: number;
  /** Free-form text the customer wrote in the Customize dialog — special requests, branding instructions, etc. */
  notes?: string;
  /** Filename of the logo the customer uploaded; the actual file is collected separately at fulfilment time. */
  logoFilename?: string;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (
    product: Product,
    qty?: number,
    meta?: { notes?: string; logoFilename?: string },
  ) => void;
  removeItem: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "rumicarts:cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      }
    } catch {
      // ignore
    }
  }, [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((s, i) => s + i.qty, 0),
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem: (product, qty = 1, meta) => {
        setItems((prev) => {
          const existing = prev.find((i) => i.slug === product.slug);
          if (existing) {
            return prev.map((i) =>
              i.slug === product.slug ? { ...i, qty: i.qty + qty } : i,
            );
          }
          return [
            ...prev,
            {
              slug: product.slug,
              title: product.title,
              price: product.price,
              image: product.image,
              qty,
              ...(meta?.notes ? { notes: meta.notes } : {}),
              ...(meta?.logoFilename ? { logoFilename: meta.logoFilename } : {}),
            },
          ];
        });
        setIsOpen(true);
      },
      removeItem: (slug) => setItems((prev) => prev.filter((i) => i.slug !== slug)),
      setQty: (slug, qty) =>
        setItems((prev) =>
          prev
            .map((i) => (i.slug === slug ? { ...i, qty: Math.max(1, qty) } : i))
            .filter((i) => i.qty > 0),
        ),
      clear: () => setItems([]),
    }),
    [items, isOpen],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
