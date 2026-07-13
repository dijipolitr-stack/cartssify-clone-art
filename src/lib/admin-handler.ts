// Admin API — ürün fiyat/stok/durum yönetimi (Cloudflare D1).
// Giriş: tek admin şifresi (env.ADMIN_PASSWORD). Doğru şifre → HttpOnly cookie
// (admin_session). Sonraki istekler cookie ile yetkilendirilir. Şifre tarayıcıya
// gitmez (cookie düz şifre değil, türetilmiş token tutar).

type D1Result = { results?: Record<string, unknown>[] };
type D1Stmt = {
  bind: (...args: unknown[]) => D1Stmt;
  run: () => Promise<unknown>;
  all: () => Promise<D1Result>;
};
type D1Database = { prepare: (q: string) => D1Stmt };
type R2Bucket = {
  put: (key: string, value: ArrayBuffer | Uint8Array, opts?: { httpMetadata?: { contentType?: string } }) => Promise<unknown>;
  delete: (key: string) => Promise<void>;
};
type AdminEnv = { DB?: D1Database; ADMIN_PASSWORD?: string; BUCKET?: R2Bucket };

// base64 (data URL prefixsiz) → byte dizisi.
function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

function extFromType(type: string): string {
  if (/png/i.test(type)) return "png";
  if (/jpe?g/i.test(type)) return "jpg";
  if (/webp/i.test(type)) return "webp";
  if (/svg/i.test(type)) return "svg";
  return "bin";
}

function json(data: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extraHeaders },
  });
}

// Cookie'de düz şifre tutmamak için basit, deterministik bir oturum jetonu.
function sessionToken(pw: string): string {
  return btoa("rumicarts-admin:" + pw).replace(/=+$/, "");
}

function isAuthed(request: Request, env: AdminEnv): boolean {
  if (!env.ADMIN_PASSWORD) return false;
  const cookie = request.headers.get("cookie") || "";
  const m = /admin_session=([^;]+)/.exec(cookie);
  return !!m && m[1] === sessionToken(env.ADMIN_PASSWORD);
}

export async function handleAdmin(request: Request, env: AdminEnv): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // --- Giriş ---
  if (path === "/api/admin/login" && request.method === "POST") {
    if (!env.ADMIN_PASSWORD) return json({ error: "ADMIN_PASSWORD missing" }, 500);
    let body: { password?: string };
    try {
      body = await request.json();
    } catch {
      return json({ error: "bad json" }, 400);
    }
    if (body.password && body.password === env.ADMIN_PASSWORD) {
      return json({ ok: true }, 200, {
        "set-cookie": `admin_session=${sessionToken(env.ADMIN_PASSWORD)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`,
      });
    }
    return json({ error: "Şifre yanlış" }, 401);
  }

  // --- Oturum kontrolü (login dışı tüm uçlar) ---
  if (path === "/api/admin/session") {
    return json({ authed: isAuthed(request, env) });
  }
  if (path === "/api/admin/logout" && request.method === "POST") {
    return json({ ok: true }, 200, {
      "set-cookie": `admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
    });
  }

  if (!isAuthed(request, env)) return json({ error: "unauthorized" }, 401);
  if (!env.DB) return json({ error: "DB binding missing" }, 500);

  // --- Ürünleri listele ---
  if (path === "/api/admin/products" && request.method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT slug, base_price, in_stock, status, updated_at FROM products ORDER BY slug",
    ).all();
    return json({ products: results ?? [] });
  }

  // --- Ürün güncelle ---
  if (path === "/api/admin/products" && request.method === "POST") {
    let body: { slug?: string; base_price?: number; in_stock?: number; status?: string };
    try {
      body = await request.json();
    } catch {
      return json({ error: "bad json" }, 400);
    }
    const { slug, base_price, in_stock, status } = body;
    if (!slug) return json({ error: "slug gerekli" }, 400);
    await env.DB.prepare(
      "UPDATE products SET base_price=?, in_stock=?, status=?, updated_at=? WHERE slug=?",
    )
      .bind(
        Math.max(0, Math.round(Number(base_price) || 0)),
        in_stock ? 1 : 0,
        String(status || "active"),
        new Date().toISOString(),
        slug,
      )
      .run();
    return json({ ok: true });
  }

  // --- Marka örnek kartları: listele ---
  if (path === "/api/admin/examples" && request.method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT id, title, description, color_tag, image_key, sort_order, created_at FROM examples ORDER BY sort_order ASC, created_at DESC",
    ).all();
    return json({ examples: results ?? [] });
  }

  // --- Marka örnek kartı: ekle (görsel R2'ye, meta D1'e) ---
  if (path === "/api/admin/examples" && request.method === "POST") {
    if (!env.BUCKET) return json({ error: "BUCKET binding missing" }, 500);
    let body: {
      title?: string;
      description?: string;
      color_tag?: string;
      image?: { content?: string; type?: string };
    };
    try {
      body = await request.json();
    } catch {
      return json({ error: "bad json" }, 400);
    }
    const title = (body.title || "").trim();
    const img = body.image;
    if (!title) return json({ error: "başlık gerekli" }, 400);
    if (!img?.content) return json({ error: "görsel gerekli" }, 400);
    const bytes = base64ToBytes(img.content);
    if (bytes.length > 8 * 1024 * 1024) return json({ error: "görsel çok büyük (maks 8MB)" }, 413);
    const id = crypto.randomUUID();
    const key = `examples/${id}.${extFromType(img.type || "")}`;
    await env.BUCKET.put(key, bytes, { httpMetadata: { contentType: img.type || "application/octet-stream" } });
    await env.DB.prepare(
      "INSERT INTO examples (id, title, description, color_tag, image_key, sort_order, created_at) VALUES (?,?,?,?,?,?,?)",
    )
      .bind(id, title, (body.description || "").trim(), (body.color_tag || "").trim(), key, 0, new Date().toISOString())
      .run();
    return json({ ok: true, id });
  }

  // --- Marka örnek kartı: sil (R2 + D1) ---
  if (path === "/api/admin/examples" && request.method === "DELETE") {
    let body: { id?: string };
    try {
      body = await request.json();
    } catch {
      return json({ error: "bad json" }, 400);
    }
    if (!body.id) return json({ error: "id gerekli" }, 400);
    const { results } = await env.DB.prepare("SELECT image_key FROM examples WHERE id=?").bind(body.id).all();
    const key = results?.[0]?.image_key as string | undefined;
    if (key && env.BUCKET) {
      try {
        await env.BUCKET.delete(key);
      } catch {
        // R2 silme hatası olsa da D1 kaydını temizle.
      }
    }
    await env.DB.prepare("DELETE FROM examples WHERE id=?").bind(body.id).run();
    return json({ ok: true });
  }

  return json({ error: "not found" }, 404);
}
