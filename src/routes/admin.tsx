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

type ExRow = {
  id: string;
  title: string;
  description: string;
  color_tag: string;
  image_key: string;
};
type ExImg = { content: string; type: string; dataUrl: string; name: string };

function readImage(file: File): Promise<ExImg> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const dataUrl = String(fr.result);
      resolve({
        content: dataUrl.split(",")[1] ?? "",
        type: file.type || "application/octet-stream",
        dataUrl,
        name: file.name,
      });
    };
    fr.onerror = () => reject(new Error("read"));
    fr.readAsDataURL(file);
  });
}

function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState<Row[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // Marka örnek kartları
  const [examples, setExamples] = useState<ExRow[]>([]);
  const [exTitle, setExTitle] = useState("");
  const [exDesc, setExDesc] = useState("");
  const [exColor, setExColor] = useState("");
  const [exImg, setExImg] = useState<ExImg | null>(null);
  const [exBusy, setExBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((r) => r.json())
      .then((d) => setAuthed(!!d.authed))
      .catch(() => setAuthed(false));
  }, []);

  useEffect(() => {
    if (authed) {
      void loadProducts();
      void loadExamples();
    }
  }, [authed]);

  async function loadExamples() {
    const r = await fetch("/api/admin/examples");
    if (r.ok) {
      const d = (await r.json()) as { examples: ExRow[] };
      setExamples(d.examples ?? []);
    }
  }

  async function addExample() {
    if (!exTitle.trim() || !exImg) {
      setMsg("Başlık ve görsel gerekli");
      return;
    }
    setExBusy(true);
    setMsg("");
    try {
      const r = await fetch("/api/admin/examples", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: exTitle.trim(),
          description: exDesc.trim(),
          color_tag: exColor.trim(),
          image: { content: exImg.content, type: exImg.type },
        }),
      });
      if (r.ok) {
        setExTitle("");
        setExDesc("");
        setExColor("");
        setExImg(null);
        setMsg("✓ Örnek eklendi");
        void loadExamples();
      } else {
        const d = (await r.json()) as { error?: string };
        setMsg(d.error || "Eklenemedi");
      }
    } finally {
      setExBusy(false);
    }
  }

  async function deleteExample(id: string) {
    setExBusy(true);
    try {
      await fetch("/api/admin/examples", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      void loadExamples();
    } finally {
      setExBusy(false);
    }
  }

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

      {/* ---- Marka Örnek Kartları ---- */}
      <div className="mt-14">
        <h2 className="text-xl font-medium mb-1">Örnek Tasarımlar</h2>
        <p className="text-xs text-muted-foreground mb-6">
          Kendi görsellerinle örnek kart ekle; "Örnek Tasarımlar" (/products) sayfasının üstünde görünür.
        </p>

        {/* Ekleme formu */}
        <div className="border border-border p-5 mb-8">
          <div className="grid sm:grid-cols-[160px_1fr] gap-5 items-start">
            {/* Görsel */}
            <div>
              {exImg ? (
                <div className="relative">
                  <img src={exImg.dataUrl} alt="" className="w-full aspect-square object-contain bg-secondary rounded border border-border" />
                  <button
                    onClick={() => setExImg(null)}
                    className="mt-2 text-[11px] text-red-600 hover:underline"
                  >
                    Görseli kaldır
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 w-full aspect-square bg-secondary rounded border border-dashed border-border cursor-pointer text-xs text-muted-foreground hover:border-foreground">
                  <span>+ Görsel seç</span>
                  <span className="text-[10px]">PNG / JPG / WebP (maks 8MB)</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) setExImg(await readImage(f));
                    }}
                  />
                </label>
              )}
            </div>

            {/* Meta */}
            <div className="space-y-3">
              <label className="block text-xs">
                <span className="block text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Başlık</span>
                <input
                  value={exTitle}
                  onChange={(e) => setExTitle(e.target.value)}
                  placeholder="Ör. Mavi Tenteli Özel Tasarım"
                  className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground"
                />
              </label>
              <label className="block text-xs">
                <span className="block text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Açıklama (opsiyonel)</span>
                <textarea
                  value={exDesc}
                  onChange={(e) => setExDesc(e.target.value)}
                  rows={2}
                  placeholder="Kısa açıklama"
                  className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground resize-none"
                />
              </label>
              <label className="block text-xs">
                <span className="block text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Renk etiketi (opsiyonel)</span>
                <input
                  value={exColor}
                  onChange={(e) => setExColor(e.target.value)}
                  placeholder="Ör. Mavi"
                  className="w-40 border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground"
                />
              </label>
              <button
                onClick={addExample}
                disabled={exBusy || !exTitle.trim() || !exImg}
                className="bg-foreground text-background text-xs uppercase tracking-wide px-5 py-2.5 hover:opacity-90 disabled:opacity-40"
              >
                {exBusy ? "Ekleniyor…" : "Örnek ekle"}
              </button>
            </div>
          </div>
        </div>

        {/* Mevcut örnekler */}
        {examples.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz örnek eklenmedi.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {examples.map((ex) => (
              <div key={ex.id} className="border border-border rounded overflow-hidden">
                <img src={`/assets/${ex.image_key}`} alt={ex.title} className="w-full aspect-square object-contain bg-secondary" />
                <div className="p-2.5">
                  <div className="text-sm font-medium truncate">{ex.title}</div>
                  {ex.color_tag && <div className="text-[11px] text-muted-foreground">{ex.color_tag}</div>}
                  <button
                    onClick={() => deleteExample(ex.id)}
                    disabled={exBusy}
                    className="mt-2 text-[11px] text-red-600 hover:underline disabled:opacity-50"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
