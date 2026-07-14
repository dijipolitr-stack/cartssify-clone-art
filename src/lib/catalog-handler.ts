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

export type ModelItem = {
  key: string;
  base_price: number;
  stock: number;
  status: string;
};

export async function handleCatalog(_request: Request, env: CatalogEnv): Promise<Response> {
  if (!env.DB) return json({ items: [], models: [], settings: {} });
  try {
    const [prod, mdl, setg] = await Promise.all([
      env.DB.prepare("SELECT slug, base_price, in_stock, status FROM products").all(),
      env.DB.prepare("SELECT key, base_price, stock, status FROM models").all().catch(() => ({ results: [] })),
      env.DB.prepare("SELECT key, value FROM settings").all().catch(() => ({ results: [] })),
    ]);
    const items: CatalogItem[] = (prod.results ?? []).map((r) => ({
      slug: String(r.slug),
      base_price: Number(r.base_price) || 0,
      in_stock: Number(r.in_stock) ? 1 : 0,
      status: String(r.status || "active"),
    }));
    const models: ModelItem[] = (mdl.results ?? []).map((r) => ({
      key: String(r.key),
      base_price: Number(r.base_price) || 0,
      stock: Number(r.stock) || 0,
      status: String(r.status || "active"),
    }));
    const settings: Record<string, string> = {};
    for (const r of setg.results ?? []) settings[String(r.key)] = String(r.value ?? "");
    return json({ items, models, settings });
  } catch {
    // Tablo yoksa veya hata olursa site statik değerlere düşer.
    return json({ items: [], models: [], settings: {} });
  }
}
