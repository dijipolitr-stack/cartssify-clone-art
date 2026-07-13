-- Rumicarts admin veritabanı şeması (Cloudflare D1)
-- products: admin panelinden düzenlenen fiyat / stok / durum bilgisi.
-- slug = configurator.ts CONFIG_PRODUCTS slug'ı ile eşleşir; site bu tabloyu
-- okuyup statik veriyi (fiyat/stok) override eder.

CREATE TABLE IF NOT EXISTS products (
  slug       TEXT PRIMARY KEY,
  base_price INTEGER NOT NULL,            -- USD (tam dolar)
  in_stock   INTEGER NOT NULL DEFAULT 1,  -- 1 = stokta, 0 = tükendi
  status     TEXT NOT NULL DEFAULT 'active', -- active | hidden | coming_soon
  updated_at TEXT
);

INSERT OR IGNORE INTO products (slug, base_price, in_stock, status) VALUES
  ('kart-100-mat-lam',     1800, 1, 'active'),
  ('kart-150-mat-lam',     2200, 1, 'active'),
  ('kart-100-parlak-lake', 2100, 1, 'active'),
  ('kart-150-parlak-lake', 2500, 1, 'active');

-- examples: markanın admin panelinden kendi görselleriyle eklediği örnek/vitrin
-- kartları. Görsel R2'de (image_key), meta bilgi burada. /products'ta gösterilir.
CREATE TABLE IF NOT EXISTS examples (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  color_tag   TEXT,
  image_key   TEXT NOT NULL,           -- R2 nesne anahtarı (examples/<id>.<ext>)
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT
);
