import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Rumicarts — Admin" }] }),
});

type Row = {
  slug: string;
  base_price: number;
  in_stock: number;
  status: string;
  updated_at?: string;
};

const STATUS_OPTS = [
  { v: "active", l: "Aktif" },
  { v: "coming_soon", l: "Çok Yakında" },
  { v: "hidden", l: "Gizli" },
];

function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState<Row[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((r) => r.json())
      .then((d) => setAuthed(!!d.authed))
      .catch(() => setAuthed(false));
  }, []);

  useEffect(() => {
    if (authed) void loadProducts();
  }, [authed]);

  async function loadProducts() {
    const r = await fetch("/api/admin/products");
    if (r.ok) {
      const d = (await r.json()) as { products: Row[] };
      setProducts(d.products);
    } else if (r.status === 401) {
      setAuthed(false);
    }
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (r.ok) {
        setAuthed(true);
        setPassword("");
      } else {
        const d = (await r.json()) as { error?: string };
        setMsg(d.error || "Giriş başarısız");
      }
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setProducts([]);
  }

  async function save(row: Row) {
    setMsg("");
    setBusy(true);
    try {
      const r = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(row),
      });
      setMsg(r.ok ? `✓ ${row.slug} kaydedildi` : "Kaydedilemedi");
    } finally {
      setBusy(false);
    }
  }

  function edit(slug: string, field: keyof Row, value: string | number) {
    setProducts((ps) =>
      ps.map((p) => (p.slug === slug ? { ...p, [field]: value } : p)),
    );
  }

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Yükleniyor…
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <form
          onSubmit={login}
          className="w-full max-w-sm border border-border p-8 flex flex-col gap-4"
        >
          <h1 className="text-lg font-medium">Rumicarts Admin</h1>
          <p className="text-xs text-muted-foreground">
            Yönetici şifresiyle giriş yap.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifre"
            autoFocus
            className="border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground"
          />
          <button
            type="submit"
            disabled={busy}
            className="bg-foreground text-background text-sm py-2 hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Giriş yapılıyor…" : "Giriş"}
          </button>
          {msg && <p className="text-xs text-red-600">{msg}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-medium">Ürün Yönetimi</h1>
        <button
          onClick={logout}
          className="text-xs tracking-wide uppercase border border-border px-3 py-1.5 hover:border-foreground"
        >
          Çıkış
        </button>
      </div>

      {msg && (
        <p className="mb-4 text-sm text-green-700">{msg}</p>
      )}

      <div className="space-y-4">
        {products.map((p) => (
          <div
            key={p.slug}
            className="border border-border p-4 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-end"
          >
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Ürün
              </div>
              <div className="text-sm font-medium">{p.slug}</div>
            </div>
            <label className="text-xs">
              <span className="block text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                Fiyat (USD)
              </span>
              <input
                type="number"
                value={p.base_price}
                onChange={(e) => edit(p.slug, "base_price", Number(e.target.value))}
                className="w-24 border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:border-foreground"
              />
            </label>
            <label className="text-xs">
              <span className="block text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                Stok
              </span>
              <select
                value={p.in_stock}
                onChange={(e) => edit(p.slug, "in_stock", Number(e.target.value))}
                className="border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:border-foreground"
              >
                <option value={1}>Stokta</option>
                <option value={0}>Tükendi</option>
              </select>
            </label>
            <label className="text-xs">
              <span className="block text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                Durum
              </span>
              <select
                value={p.status}
                onChange={(e) => edit(p.slug, "status", e.target.value)}
                className="border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:border-foreground"
              >
                {STATUS_OPTS.map((s) => (
                  <option key={s.v} value={s.v}>
                    {s.l}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => save(p)}
              disabled={busy}
              className="bg-foreground text-background text-xs uppercase tracking-wide px-4 py-2 hover:opacity-90 disabled:opacity-50"
            >
              Kaydet
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
