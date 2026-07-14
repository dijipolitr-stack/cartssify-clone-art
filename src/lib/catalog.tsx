// Katalog override'ları — admin'in D1'de tuttuğu fiyat/stok/durum bilgisini
// (/api/catalog) tarayıcıda okuyup koddaki statik değerleri ezmek için context.
// Değer gelene kadar site statik fiyatı gösterir (flash minimal); gelince günceller.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { CatalogItem, ModelItem } from "@/lib/catalog-handler";

export type CatalogOverride = { base_price: number; in_stock: boolean; status: string };
export type ModelOverride = { base_price: number; stock: number; status: string };

type CatalogState = {
  products: Record<string, CatalogOverride>;
  models: Record<string, ModelOverride>;
  settings: Record<string, string>;
};

const CatalogContext = createContext<CatalogState>({ products: {}, models: {}, settings: {} });

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CatalogState>({ products: {}, models: {}, settings: {} });

  useEffect(() => {
    let alive = true;
    fetch("/api/catalog")
      .then((r) => (r.ok ? r.json() : { items: [], models: [], settings: {} }))
      .then((d: { items?: CatalogItem[]; models?: ModelItem[]; settings?: Record<string, string> }) => {
        if (!alive) return;
        const products: Record<string, CatalogOverride> = {};
        for (const it of d.items ?? []) {
          products[it.slug] = { base_price: it.base_price, in_stock: !!it.in_stock, status: it.status || "active" };
        }
        const models: Record<string, ModelOverride> = {};
        for (const m of d.models ?? []) {
          models[m.key] = { base_price: m.base_price, stock: m.stock, status: m.status || "active" };
        }
        setState({ products, models, settings: d.settings ?? {} });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return <CatalogContext.Provider value={state}>{children}</CatalogContext.Provider>;
}

/** Bir configSlug (ürün) için admin override'ı. */
export function useCatalogOverride(slug?: string): CatalogOverride | undefined {
  const s = useContext(CatalogContext);
  return slug ? s.products[slug] : undefined;
}

/** Bir model anahtarı (boyut-metal-yapı) için admin fiyat/stok override'ı. */
export function useModelOverride(key?: string): ModelOverride | undefined {
  const s = useContext(CatalogContext);
  return key ? s.models[key] : undefined;
}

/** Bir ayar değeri (ör. lake_delta). */
export function useSetting(key: string): string | undefined {
  const s = useContext(CatalogContext);
  return s.settings[key];
}
