// Ön teklif talebi -> Resend ile mail gönderimi.
// Frontend konfigüratör özeti + müşteri adayının telefon/e-posta bilgisini POST eder;
// burada (Cloudflare Worker) Resend API'siyle QUOTE_TO_EMAIL adresine mail atılır.
// API anahtarı (RESEND_API_KEY) sunucuda kalır, tarayıcıya gitmez.

type QuoteEnv = {
  RESEND_API_KEY?: string;
  QUOTE_TO_EMAIL?: string;
  // Gönderen adresi opsiyonel — domain doğrulanınca kendi adresin, yoksa Resend paylaşımlı.
  QUOTE_FROM_EMAIL?: string;
};

type QuotePayload = {
  name?: string;
  phone?: string;
  email?: string;
  summary?: string;
  productTitle?: string;
  total?: string;
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function handleQuote(request: Request, env: QuoteEnv): Promise<Response> {
  if (request.method !== "POST") return json({ error: "method" }, 405);

  // env yalnızca deploy edilmiş worker'da (veya wrangler dev) doludur; vite dev'de undefined.
  const to = env?.QUOTE_TO_EMAIL;
  const key = env?.RESEND_API_KEY;
  if (!key) return json({ error: "RESEND_API_KEY missing" }, 500);
  if (!to) return json({ error: "QUOTE_TO_EMAIL missing" }, 500);

  let p: QuotePayload;
  try {
    p = (await request.json()) as QuotePayload;
  } catch {
    return json({ error: "bad json" }, 400);
  }

  const name = (p.name ?? "").trim();
  const phone = (p.phone ?? "").trim();
  const email = (p.email ?? "").trim();
  const summary = (p.summary ?? "").trim();
  const productTitle = (p.productTitle ?? "").trim();
  const total = (p.total ?? "").trim();

  // Zorunlu alan doğrulaması (frontend de engelliyor ama sunucu son sözü söyler).
  if (!phone) return json({ error: "phone required", field: "phone" }, 422);
  if (!email || !EMAIL_RE.test(email)) return json({ error: "email invalid", field: "email" }, 422);

  const subject = `Yeni teklif talebi${productTitle ? ` — ${productTitle}` : ""}`;

  const textLines = [
    "YENİ ÖN TEKLİF TALEBİ",
    "",
    `Ad Soyad: ${name || "-"}`,
    `Telefon: ${phone}`,
    `E-posta: ${email}`,
    "",
    productTitle ? `Ürün: ${productTitle}` : "",
    total ? `Tahmini tutar: ${total}` : "",
    "",
    "— TASARIM ÖZETİ —",
    summary || "(özet yok)",
  ].filter((l) => l !== "");
  const text = textLines.join("\n");

  const html =
    `<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;font-size:14px;color:#111;line-height:1.5">` +
    `<h2 style="margin:0 0 12px">Yeni ön teklif talebi</h2>` +
    `<table style="border-collapse:collapse;margin-bottom:16px">` +
    `<tr><td style="padding:2px 12px 2px 0;color:#666">Ad Soyad</td><td><b>${esc(name || "-")}</b></td></tr>` +
    `<tr><td style="padding:2px 12px 2px 0;color:#666">Telefon</td><td><b>${esc(phone)}</b></td></tr>` +
    `<tr><td style="padding:2px 12px 2px 0;color:#666">E-posta</td><td><b>${esc(email)}</b></td></tr>` +
    (productTitle ? `<tr><td style="padding:2px 12px 2px 0;color:#666">Ürün</td><td>${esc(productTitle)}</td></tr>` : "") +
    (total ? `<tr><td style="padding:2px 12px 2px 0;color:#666">Tahmini tutar</td><td>${esc(total)}</td></tr>` : "") +
    `</table>` +
    `<div style="color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Tasarım özeti</div>` +
    `<pre style="white-space:pre-wrap;background:#f6f6f6;border:1px solid #e5e5e5;border-radius:8px;padding:12px;margin:0;font-family:inherit">${esc(summary || "(özet yok)")}</pre>` +
    `</div>`;

  const from = env.QUOTE_FROM_EMAIL || "Rumicarts Teklif <onboarding@resend.dev>";

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email, // "Yanıtla" dendiğinde müşteri adayına gider
        subject,
        text,
        html,
      }),
    });
    if (!r.ok) {
      const body = await r.text();
      console.error("Resend hata:", r.status, body);
      return json({ error: "send failed", status: r.status }, 502);
    }
    return json({ ok: true });
  } catch (e) {
    console.error("Quote gönderim hatası:", e);
    return json({ error: "send exception" }, 502);
  }
}
