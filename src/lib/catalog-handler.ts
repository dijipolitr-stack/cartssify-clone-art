// Public katalog ucu — admin'in D1'de tuttuğu fiyat/stok/durum bilgisini
// (kimlik doğrulama olmadan) siteye açar. Site bu değerlerle koddaki statik
// fiyatları ezer → admin panelindeki değişiklik canlı siteye yansır.

type D1Result = { results?: Record<string, unknown>[] };
type D1Stmt = { all: () => Promise<D1Result> };
type D1Database = { prepare: (q: string) => D1Stmt };
type CatalogEnv = { DB?: D1Database };

export type CatalogItem = {
  slug: string;
  base_price: number;
  in_stock: number;
  status: string;
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Kısa süreli önbellek: fiyat değişikliği en geç ~60 sn'de yansır, her
      // istekte D1'e gidilmez.
      "cache-control": "public, max-age=60",
    },
  });
}

export async function handleCatalog(_request: Request, env: CatalogEnv): Promise<Response> {
  if (!env.DB) return json({ items: [] });
  try {
    const { results } = await env.DB.prepare(
      "SELECT slug, base_price, in_stock, status FROM products",
    ).all();
    const items: CatalogItem[] = (results ?? []).map((r) => ({
      slug: String(r.slug),
      base_price: Number(r.base_price) || 0,
      in_stock: Number(r.in_stock) ? 1 : 0,
      status: String(r.status || "active"),
    }));
    return json({ items });
  } catch {
    // Tablo yoksa veya hata olursa site statik değerlere düşer.
    return json({ items: [] });
  }
}
