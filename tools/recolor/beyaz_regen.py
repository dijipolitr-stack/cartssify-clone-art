#!/usr/bin/env python3
"""100-krom-tutamacli beyaz tentesiz'i SIYAH'tan Gemini ile yeniden uretir + siyah kadrajina hizalar.

Sebep: krom beyaz native kadraji tutarsizdi (kare-basi farkli olcek, biri kadraj disi).
Yontem: siyah (dogru kadraj+sira) -> Gemini black->white recolor -> obje bbox'ini siyaha tam
hizala (scale+translate). Cikti beyaz, kadraj+aci+sira siyahla birebir. Logo koyu-on-white.
tentesiz(tekerlekli) + tekeryok(tekersiz) 7'ser kare. Cikti staging (QA icin).
"""
import os, sys, base64, json, time, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
V2 = os.path.join(ROOT, "public", "renders", "v2")
CFG = os.environ.get("BEYAZ_CFG", "100-krom-tutamacli")
TENTE = os.environ.get("BEYAZ_TENTE", "tentesiz")   # tentesiz | tenteli
OUT = os.path.join(os.path.dirname(__file__), "_beyaz_regen", CFG, TENTE)
MODEL = "gemini-2.5-flash-image"

def key():
    p = os.path.join(ROOT, "..", "..", "_knowledge", "credentials", "master.env")
    for ln in open(p, encoding="utf-8"):
        if ln.startswith("GEMINI_API_KEY="):
            return ln.split("=", 1)[1].strip()
    raise SystemExit("GEMINI_API_KEY yok")
KEY = key()

# config-tipi + metal duyarli prompt (dewheel_gemini.py deseni)
_c = CFG.lower()
METAL = "BRASS/GOLD" if "pirinc" in _c else "chrome/silver"
if "rafli" in _c:
    PARTS = (
        "This cart has fold-out drop-leaf SIDE TABLES/shelves and NO push handle. Keep the side tables "
        "EXACTLY as they appear in the input (same side, same fold state, same position), but recolor "
        "their tabletop surfaces to the SAME clean matte WHITE as the body — the side tables must NOT "
        "stay black; every panel and tabletop of the cart becomes white. Do NOT add, draw, or invent "
        "ANY push handle, bar, rail, or tube anywhere."
    )
else:
    PARTS = (
        "This cart has a metal PUSH HANDLE and NO fold-out side tables. Keep the push handle EXACTLY as "
        "it appears in the input (same side); do NOT add, unfold, or invent any side table/shelf/tray."
    )

AWNING = (
    " There is also a fabric AWNING/canopy on top supported by metal poles; recolor the awning fabric "
    "from black to the SAME clean matte WHITE and keep any RUMICARTS logo on the awning DARK/readable; "
    f"keep the poles {METAL} metal."
) if TENTE == "tenteli" else ""

PROMPT = (
    "You are editing a product studio photo of a matte BLACK mobile serving cart on a plain white "
    "background. TASK: recolor ONLY the cart's body/cabinet panels and the counter TOP surface from "
    "black to clean matte WHITE (like a white-painted wood cabinet). "
    + AWNING +
    " Keep EVERYTHING else 100% identical and in the exact same position/scale/framing: the "
    f"{METAL} metal parts (poles, handle, wheel rim/accents) stay {METAL} — do NOT change their metal "
    "color to any other metal; the spoked decorative wheel; the small corner swivel casters; the shadows; "
    f"and the composition. {PARTS} LOGO RULE: IF (and only if) the input already shows a RUMICARTS "
    "logo/text on a body panel, keep it in the SAME place and make it DARK grey/black so it stays "
    "readable on the now-white body. IF a panel is plain black with NO logo (e.g. back or side panels, "
    "closed doors), keep it PLAIN WHITE with NO text — do NOT add, invent, draw, or copy any logo/text "
    "onto a plain panel. Do NOT change the cart shape, angle, or framing — only the body color from "
    "black to white."
)

def call_gemini(src_bytes, ptext, tries=5):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={KEY}"
    body = json.dumps({"contents": [{"parts": [
        {"text": ptext},
        {"inlineData": {"mimeType": "image/webp", "data": base64.b64encode(src_bytes).decode()}},
    ]}]}).encode()
    last = ""
    for a in range(1, tries + 1):
        try:
            req = urllib.request.Request(url, data=body, headers={"content-type": "application/json"})
            with urllib.request.urlopen(req, timeout=120) as r:
                j = json.load(r)
            for p in j.get("candidates", [{}])[0].get("content", {}).get("parts", []):
                d = p.get("inlineData", {}).get("data")
                if d:
                    return base64.b64decode(d)
            last = "gorsel donmedi"
        except urllib.error.HTTPError as e:
            last = f"HTTP {e.code} {e.read()[:160].decode(errors='ignore')}"
            if e.code not in (429, 500, 502, 503, 504):
                break
        except Exception as e:
            last = str(e)
        time.sleep(a * 2.5)
    raise RuntimeError(last)

def _bbox(a, thr):
    m = a.min(2) < thr
    ys, xs = np.where(m)
    return (int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max()))

def align(g, siyah_rgb):
    """beyaz Gemini ciktisinin obje bbox'ini siyah referansa tam hizala (scale+translate)."""
    sb = _bbox(siyah_rgb, 200)
    gb = _bbox(np.array(g), 235)
    sw, sh = sb[1]-sb[0], sb[3]-sb[2]
    gw, gh = gb[1]-gb[0], gb[3]-gb[2]
    s = min(sw/gw, sh/gh)
    ns = max(1, round(1400*s))
    gs = g.resize((ns, ns), Image.LANCZOS)
    gb2 = _bbox(np.array(gs), 235)
    canvas = Image.new("RGB", (1400, 1400), (255, 255, 255))
    canvas.paste(gs, (round(sb[0]-gb2[0]), round(sb[2]-gb2[2])))
    return canvas, s

def one(tente_sub, fr):
    # tente_sub: "" (tekerlekli) veya "tekeryok"; TENTE (env) = tentesiz|tenteli katalog
    sdir = os.path.join(V2, CFG, "siyah", TENTE, tente_sub) if tente_sub else os.path.join(V2, CFG, "siyah", TENTE)
    src = os.path.join(sdir, f"{fr:02d}.webp")
    odir = os.path.join(OUT, tente_sub or "root")
    os.makedirs(odir, exist_ok=True)
    try:
        siyah = np.array(Image.open(src).convert("RGB"))
        raw = call_gemini(open(src, "rb").read(), PROMPT)
        g = Image.open(__import__("io").BytesIO(raw)).convert("RGB").resize((1400, 1400), Image.LANCZOS)
        aligned, s = align(g, siyah)
        aligned.save(os.path.join(odir, f"{fr:02d}.webp"), "WEBP", quality=90, method=6)
        return (tente_sub or "root", fr, f"OK s={s:.3f}")
    except Exception as e:
        return (tente_sub or "root", fr, f"HATA {str(e)[:80]}")

def main():
    frames = [int(x) for x in sys.argv[1].split(",")] if len(sys.argv) > 1 else list(range(1, 8))
    jobs = [(t, f) for t in ["", "tekeryok"] for f in frames]
    print(f"{len(jobs)} is: {CFG} beyaz (siyahtan recolor+hizala)")
    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = {ex.submit(one, t, f): (t, f) for t, f in jobs}
        for fut in as_completed(futs):
            sub, fr, st = fut.result()
            print(f"  {sub}/{fr:02d}: {st}")

if __name__ == "__main__":
    main()
