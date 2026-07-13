// Katalog override'ları — admin'in D1'de tuttuğu fiyat/stok/durum bilgisini
// (/api/catalog) tarayıcıda okuyup koddaki statik değerleri ezmek için context.
// Değer gelene kadar site statik fiyatı gösterir (flash minimal); gelince günceller.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { CatalogItem } from "@/lib/catalog-handler";

export type CatalogOverride = { base_price: number; in_stock: boolean; status: string };
type OverrideMap = Record<string, CatalogOverride>;

const CatalogContext = createContext<OverrideMap>({});

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<OverrideMap>({});

  useEffect(() => {
    let alive = true;
    fetch("/api/catalog")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d: { items?: CatalogItem[] }) => {
        if (!alive) return;
        const map: OverrideMap = {};
        for (const it of d.items ?? []) {
          map[it.slug] = {
            base_price: it.base_price,
            in_stock: !!it.in_stock,
            status: it.status || "active",
          };
        }
        setOverrides(map);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return <CatalogContext.Provider value={overrides}>{children}</CatalogContext.Provider>;
}

/** Bir configSlug için admin override'ı (yoksa undefined → statik değer kullanılır). */
export function useCatalogOverride(slug?: string): CatalogOverride | undefined {
  const map = useContext(CatalogContext);
  return slug ? map[slug] : undefined;
}
