// Gemini ile tek görsel renk değiştirme (üretken adım).
// Kullanım: node recolor.mjs <input> <output.png> "<prompt>"
// GEMINI_API_KEY env'den okunur.
import { readFileSync, writeFileSync } from "node:fs";

const KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash-image";
const [, , IN, OUT, PROMPT] = process.argv;
if (!KEY) { console.error("GEMINI_API_KEY yok"); process.exit(1); }
if (!IN || !OUT || !PROMPT) { console.error("kullanim: node recolor.mjs <in> <out> <prompt>"); process.exit(1); }

const bytes = readFileSync(IN);
const mime = IN.toLowerCase().endsWith(".webp") ? "image/webp"
  : IN.toLowerCase().endsWith(".jpg") || IN.toLowerCase().endsWith(".jpeg") ? "image/jpeg"
  : "image/png";

const body = {
  contents: [{ parts: [
    { text: PROMPT },
    { inlineData: { mimeType: mime, data: bytes.toString("base64") } },
  ] }],
};

const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const RETRY = new Set([429, 500, 502, 503, 504]); // gecici hatalar

const t0 = Date.now();
let lastErr = "";
for (let attempt = 1; attempt <= 5; attempt++) {
  try {
    const r = await fetch(URL, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
    });
    if (!r.ok) {
      lastErr = `HTTP ${r.status} ${(await r.text()).slice(0, 200)}`;
      if (RETRY.has(r.status) && attempt < 5) { await sleep(attempt * 2500); continue; }
      console.error(lastErr); process.exit(1);
    }
    const j = await r.json();
    const parts = j?.candidates?.[0]?.content?.parts ?? [];
    for (const p of parts) {
      if (p.inlineData?.data) {
        writeFileSync(OUT, Buffer.from(p.inlineData.data, "base64"));
        console.log(`OK (${Date.now() - t0}ms, deneme ${attempt}) -> ${OUT}`);
        process.exit(0);
      }
    }
    lastErr = "gorsel donmedi";
    if (attempt < 5) { await sleep(attempt * 2500); continue; }
  } catch (e) {
    lastErr = String(e);
    if (attempt < 5) { await sleep(attempt * 2500); continue; }
  }
}
console.error(lastErr); process.exit(1);
