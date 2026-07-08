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
CFG = "100-krom-tutamacli"
OUT = os.path.join(os.path.dirname(__file__), "_beyaz_regen")
MODEL = "gemini-2.5-flash-image"

def key():
    p = os.path.join(ROOT, "..", "..", "_knowledge", "credentials", "master.env")
    for ln in open(p, encoding="utf-8"):
        if ln.startswith("GEMINI_API_KEY="):
            return ln.split("=", 1)[1].strip()
    raise SystemExit("GEMINI_API_KEY yok")
KEY = key()

PROMPT = (
    "You are editing a product studio photo of a matte BLACK mobile serving cart (with a chrome "
    "push handle) on a plain white background. TASK: recolor ONLY the cart's body/cabinet panels "
    "and the counter TOP surface from black to clean matte WHITE (like a white-painted wood cabinet). "
    "Keep EVERYTHING else 100% identical and in the exact same position/scale/framing: the chrome "
    "metal push handle, the white-and-chrome spoked decorative wheel, the small corner swivel casters, "
    "the shadows, and the composition. LOGO RULE: IF (and only if) the input already shows a RUMICARTS "
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
    # tente_sub: "" (tekerlekli) veya "tekeryok"
    sdir = os.path.join(V2, CFG, "siyah", "tentesiz", tente_sub) if tente_sub else os.path.join(V2, CFG, "siyah", "tentesiz")
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
