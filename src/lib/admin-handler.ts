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
type AdminEnv = { DB?: D1Database; ADMIN_PASSWORD?: string };

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

  return json({ error: "not found" }, 404);
}
