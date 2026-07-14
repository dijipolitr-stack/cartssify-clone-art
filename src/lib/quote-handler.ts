// Ön teklif talebi -> Brevo ile mail gönderimi.
// Frontend konfigüratör özeti + müşteri adayının telefon/e-posta bilgisini POST eder;
// burada (Cloudflare Worker) Brevo API'siyle QUOTE_TO_ADDR adresine mail atılır.
// Brevo tek-gönderici doğrulaması kullanır (DNS yok) → istediğimiz alıcıya gönderir.
// API anahtarı (BREVO_API_KEY) sunucuda kalır, tarayıcıya gitmez.

type QuoteEnv = {
  BREVO_API_KEY?: string;
  // Alıcı: QUOTE_TO_ADDR öncelikli (dashboard'da takılı eski QUOTE_TO_EMAIL'i aşmak için).
  QUOTE_TO_ADDR?: string;
  QUOTE_TO_EMAIL?: string;
  // Gönderen: Brevo'da doğrulanmış gönderici e-postası (varsayılan dijipoli.tr@gmail.com).
  QUOTE_FROM_EMAIL?: string;
};

type QuoteImage = { filename?: string; content?: string; type?: string };
type QuotePayload = {
  name?: string;
  phone?: string;
  email?: string;
  summary?: string;
  productTitle?: string;
  total?: string;
  logoWanted?: boolean;
  wrapWanted?: boolean;
  logoImage?: QuoteImage | null;
  wrapImage?: QuoteImage | null;
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
  const to = env?.QUOTE_TO_ADDR || env?.QUOTE_TO_EMAIL;
  const key = env?.BREVO_API_KEY;
  if (!key) return json({ error: "BREVO_API_KEY missing" }, 500);
  if (!to) return json({ error: "QUOTE_TO missing" }, 500);

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

  // Markalama talebi + e-posta ekleri (logo / giydirme görselleri).
  const logoWanted = !!p.logoWanted;
  const wrapWanted = !!p.wrapWanted;
  const evetHayir = (b: boolean) => (b ? "Evet" : "Hayır");
  const attachments: { filename: string; content: string }[] = [];
  const addImage = (img: QuoteImage | null | undefined, fallback: string) => {
    if (!img?.content) return false;
    attachments.push({ filename: img.filename || fallback, content: img.content });
    return true;
  };
  const logoAttached = logoWanted && addImage(p.logoImage, "logo");
  const wrapAttached = wrapWanted && addImage(p.wrapImage, "giydirme");

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
    "— MARKALAMA —",
    `Logo isteniyor: ${evetHayir(logoWanted)}${logoWanted && !logoAttached ? " (görsel eklenmedi)" : ""}`,
    `Giydirme isteniyor: ${evetHayir(wrapWanted)}${wrapWanted && !wrapAttached ? " (görsel eklenmedi)" : ""}`,
    attachments.length ? `Ekli görsel: ${attachments.map((a) => a.filename).join(", ")}` : "",
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
    `<tr><td style="padding:2px 12px 2px 0;color:#666">Logo isteniyor</td><td><b>${evetHayir(logoWanted)}</b>${logoWanted && !logoAttached ? " (görsel eklenmedi)" : ""}</td></tr>` +
    `<tr><td style="padding:2px 12px 2px 0;color:#666">Giydirme isteniyor</td><td><b>${evetHayir(wrapWanted)}</b>${wrapWanted && !wrapAttached ? " (görsel eklenmedi)" : ""}</td></tr>` +
    (attachments.length ? `<tr><td style="padding:2px 12px 2px 0;color:#666">Ekli görsel</td><td>${esc(attachments.map((a) => a.filename).join(", "))}</td></tr>` : "") +
    `</table>` +
    `<div style="color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Tasarım özeti</div>` +
    `<pre style="white-space:pre-wrap;background:#f6f6f6;border:1px solid #e5e5e5;border-radius:8px;padding:12px;margin:0;font-family:inherit">${esc(summary || "(özet yok)")}</pre>` +
    `</div>`;

  const fromEmail = env.QUOTE_FROM_EMAIL || "dijipoli.tr@gmail.com";

  try {
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": key,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Rumicarts Teklif", email: fromEmail },
        to: [{ email: to }],
        replyTo: { email }, // "Yanıtla" dendiğinde müşteri adayına gider
        subject,
        textContent: text,
        htmlContent: html,
        // Brevo eki: { name, content(base64) }
        ...(attachments.length
          ? { attachment: attachments.map((a) => ({ name: a.filename, content: a.content })) }
          : {}),
      }),
    });
    if (!r.ok) {
      const body = await r.text();
      console.error("Brevo hata:", r.status, body);
      return json({ error: "send failed", status: r.status }, 502);
    }
    return json({ ok: true });
  } catch (e) {
    console.error("Quote gönderim hatası:", e);
    return json({ error: "send exception" }, 502);
  }
}
