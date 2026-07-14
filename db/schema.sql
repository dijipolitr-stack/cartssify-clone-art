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

-- models: 8 temel model (boyut×metal×yapı). Konfigüratör temel fiyatını ve stok/durumu
-- buradan okur (renk/tente/tekerlek farkları üstüne eklenir).
CREATE TABLE IF NOT EXISTS models (
  key        TEXT PRIMARY KEY,        -- "150-krom-rafli"
  base_price INTEGER NOT NULL,        -- USD (model temel fiyatı; metal+yapı dahil)
  stock      INTEGER NOT NULL DEFAULT 0,  -- adet
  status     TEXT NOT NULL DEFAULT 'active',
  updated_at TEXT
);
INSERT OR IGNORE INTO models (key, base_price, stock, status) VALUES
  ('100-krom-rafli',1890,10,'active'),
  ('100-krom-tutamacli',1800,10,'active'),
  ('100-pirinc-rafli',1970,10,'active'),
  ('100-pirinc-tutamacli',1880,10,'active'),
  ('150-krom-rafli',2290,10,'active'),
  ('150-krom-tutamacli',2200,10,'active'),
  ('150-pirinc-rafli',2370,10,'active'),
  ('150-pirinc-tutamacli',2280,10,'active');

-- settings: genel ayarlar (ör. lake_delta = Lake yüzeyin sabit fiyat farkı).
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
INSERT OR IGNORE INTO settings (key, value) VALUES ('lake_delta','300');

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
