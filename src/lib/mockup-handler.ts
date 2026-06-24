// Gemini görsel düzenleme ile gerçekçi mockup üretimi.
// Frontend araç render URL'sini + kullanıcı tasarımını (data URL) gönderir; burada
// (Cloudflare Worker, env.GEMINI_API_KEY ile) Gemini'ye iki görsel verilip tasarım
// aracın ön paneline gerçekçi (perspektif + ışık) bindirilmiş tek görsel alınır.
// API anahtarı sunucuda kalır, tarayıcıya gitmez.

type MockupEnv = { GEMINI_API_KEY?: string };

const MODEL = "gemini-2.5-flash-image";

const DEFAULT_PROMPT =
  "Take the design from the SECOND image and apply it as a full-coverage printed " +
  "graphic onto the FRONT BODY PANEL (the large flat rectangular front face below the " +
  "counter) of the cart in the FIRST image. Match the panel's perspective, lighting and " +
  "subtle shadows so it looks like a real printed wrap on that panel. Keep the awning, " +
  "frame, handle and the small caster wheels exactly as they are, fully visible. Place the " +
  "result on a clean solid white background. Output only the edited image.";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

export async function handleMockup(
  request: Request,
  env: MockupEnv,
): Promise<Response> {
  if (request.method !== "POST") return json({ error: "method" }, 405);
  const key = env.GEMINI_API_KEY;
  if (!key) return json({ error: "GEMINI_API_KEY missing" }, 500);

  let payload: { aracUrl?: string; designDataUrl?: string; prompt?: string };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "bad json" }, 400);
  }
  const { aracUrl, designDataUrl, prompt } = payload;
  if (!aracUrl || !designDataUrl) return json({ error: "missing image" }, 400);

  // Araç render'ı (aynı origin, public/renders) çek → base64
  let aracB64: string;
  try {
    const r = await fetch(aracUrl);
    if (!r.ok) return json({ error: `arac fetch ${r.status}` }, 502);
    aracB64 = toBase64(await r.arrayBuffer());
  } catch (e) {
    return json({ error: `arac fetch: ${String(e)}` }, 502);
  }

  // Tasarım data URL'sini parçala
  const m = /^data:([^;]+);base64,(.+)$/s.exec(designDataUrl);
  if (!m) return json({ error: "design must be base64 data url" }, 400);
  const designMime = m[1];
  const designB64 = m[2];

  const body = {
    contents: [
      {
        parts: [
          { text: prompt || DEFAULT_PROMPT },
          { inlineData: { mimeType: "image/webp", data: aracB64 } },
          { inlineData: { mimeType: designMime, data: designB64 } },
        ],
      },
    ],
  };

  let gj: {
    candidates?: { content?: { parts?: { inlineData?: { data: string } }[] } }[];
  };
  try {
    const gr = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!gr.ok) {
      const detail = await gr.text();
      return json({ error: `gemini ${gr.status}`, detail: detail.slice(0, 500) }, 502);
    }
    gj = await gr.json();
  } catch (e) {
    return json({ error: `gemini call: ${String(e)}` }, 502);
  }

  const parts = gj?.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    if (p.inlineData?.data) {
      return json({ mockupDataUrl: `data:image/png;base64,${p.inlineData.data}` });
    }
  }
  return json({ error: "no image in gemini response" }, 502);
}
