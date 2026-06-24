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

export async function handleMockup(
  request: Request,
  env: MockupEnv,
): Promise<Response> {
  if (request.method !== "POST") return json({ error: "method" }, 405);
  const key = env.GEMINI_API_KEY;
  if (!key) return json({ error: "GEMINI_API_KEY missing" }, 500);

  let payload: {
    aracDataUrl?: string;
    designDataUrl?: string;
    prompt?: string;
  };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "bad json" }, 400);
  }
  const { aracDataUrl, designDataUrl, prompt } = payload;
  if (!aracDataUrl || !designDataUrl) return json({ error: "missing image" }, 400);

  // İki görsel de base64 data URL olarak gelir (araç frontend'de fetch edilir →
  // Worker self-subrequest 404 sorunu olmaz).
  const am = /^data:([^;]+);base64,(.+)$/s.exec(aracDataUrl);
  if (!am) return json({ error: "arac must be base64 data url" }, 400);
  const aracMime = am[1];
  const aracB64 = am[2];

  const dm = /^data:([^;]+);base64,(.+)$/s.exec(designDataUrl);
  if (!dm) return json({ error: "design must be base64 data url" }, 400);
  const designMime = dm[1];
  const designB64 = dm[2];

  const body = {
    contents: [
      {
        parts: [
          { text: prompt || DEFAULT_PROMPT },
          { inlineData: { mimeType: aracMime, data: aracB64 } },
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
