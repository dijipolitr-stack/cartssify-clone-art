#!/usr/bin/env python3
"""Gemini sadik-silme ile buyuk dekoratif tekerlegi siler (tekerleksiz ikiz kutuphane).

Yontem (memory rumicarts-tekerleksiz-kutuphane, 2026-07-08 kullanici karari):
- gemini-2.5-flash-image ile "erase ONLY the large decorative spoked wheel + chrome fender,
  keep everything else pixel-identical" 2-adimli sadik-silme (tente+direk silmede tuttu).
- Gemini 1024 cikti verir + cerceveyi ORANSAL korur -> 1024->1400 LANCZOS resize = tekerlekli
  ikizle otomatik hizali (dogrulandi: wheel-disi fark 3.4/255).

Kullanim: python dewheel_gemini.py <config> [renk1,renk2] [tente1,tente2] [frames]
  ornek:  python dewheel_gemini.py 150-krom-rafli
  cikti:  public/renders/v2/_dewheel_gemini/<config>/<renk>/<tente>/NN.png (staging, QA icin)
GEMINI_API_KEY master.env'den.
"""
import os, sys, base64, json, time, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
V2 = os.path.join(ROOT, "public", "renders", "v2")
# Staging public/ DISINDA: vite build public/ altini dist/client'a kopyalayip deploy'da
# production'a yukluyor. Staging PNG'ler burada kalir; nihai webp'ler tekeryok/ altina konur.
OUTROOT = os.path.join(ROOT, "tools", "recolor", "_dewheel_staging", "_dewheel_gemini")
MODEL = "gemini-2.5-flash-image"

DESC = {
    "siyah": "BLACK", "mavi": "ROYAL BLUE", "kirmizi": "RED",
    "yesil": "GREEN", "beyaz": "WHITE (the body panels are white)",
}

def key():
    p = os.path.join(ROOT, "..", "..", "_knowledge", "credentials", "master.env")
    for ln in open(p, encoding="utf-8"):
        if ln.startswith("GEMINI_API_KEY="):
            return ln.split("=", 1)[1].strip()
    raise SystemExit("GEMINI_API_KEY yok")

KEY = key()

def prompt(renk, config=""):
    d = DESC[renk]
    # config-tipine duyarli parca clause'u: rafli = yan MASA var/tutamac YOK; tutamacli = tersi
    c = config.lower()
    if "rafli" in c:
        parts = (
            "Keep the fold-out side tables/shelves EXACTLY as they appear in the input (same side, "
            "same fold state). IMPORTANT: if the input shows a fold-out table on BOTH the left AND "
            "the right, keep BOTH tables fully extended (each with its single brass support arm) — "
            "when removing the wheel do NOT drop, hide, shorten, or omit the far-side (usually LEFT) "
            "table. This cart has NO push handle — do NOT add, draw, or invent ANY handle, bar, rail, "
            "or chrome tube anywhere. Below the tables the body is a SOLID CLOSED rectangular cabinet "
            "box with plain flat side panels straight to the floor: do NOT add any extra, second, or "
            "lower shelf, tray, drawer, ledge, board, or open cubby beneath or beside the tables. If "
            "a cabinet door is open showing an internal shelf, keep the open door and internal shelf."
        )
    elif "tutamacli" in c:
        parts = (
            "Keep the push handle EXACTLY as it appears in the input (same side). This cart has NO "
            "fold-out side tables/shelves — do NOT add, unfold, or invent any side table/shelf/tray. "
            "Do NOT replace the handle with a table, or add a handle on the opposite side."
        )
    else:
        parts = (
            "Keep any push handle(s), fold-out side tables/shelves and door locks EXACTLY as in the "
            "input — do NOT add, remove, unfold, extend, or reshape any of them."
        )
    return (
        f"You are editing a product studio photo of a matte {d} mobile cart on a plain white "
        f"background. TASK: erase ONLY the large decorative spoked cart-wheel and its curved "
        f"chrome fender/mudguard arc (the big wagon-style wheel), wherever it appears on the cart. "
        f"Inpaint the vacated area faithfully: where the wheel overlapped the cart body, fill with "
        f"the SAME plain matte {d} body panel with NO marks or ghosting; where it overlapped the "
        f"white floor below the cart, fill with plain clean white studio floor. Keep EVERYTHING "
        f"ELSE 100% pixel-identical to the input: the cart body shape and {d} color; the counter/"
        f"table TOP surface MUST stay the SAME {d} color as the body (NEVER black, dark grey, wood, "
        f"or a different material), a FLAT CLOSED top (not an open tray/well/recess); the fabric "
        f"awning and its support poles if present; and the small corner swivel casters with their "
        f"soft shadows. {parts} Keep any EXISTING RUMICARTS logo/subtitle exactly as-is, but do "
        f"NOT add, invent, or draw any logo/text on plain panels. CRITICAL: only the big decorative "
        f"wheel is removed; add nothing new anywhere. Do NOT redraw, re-render, move, reshape, or "
        f"recolor anything else. Keep the same framing and composition."
    )

def call_gemini(src_bytes, mime, ptext, tries=5):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={KEY}"
    body = json.dumps({"contents": [{"parts": [
        {"text": ptext},
        {"inlineData": {"mimeType": mime, "data": base64.b64encode(src_bytes).decode()}},
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

def body_h(a):
    """cart govde yaklasik yuksekligi (hizalama sanity)."""
    dark = a.max(2) < 90 if a.max() > 60 else (a.min(2) < 240)
    ys = np.where(dark.any(1))[0]
    return (ys.max() - ys.min()) if len(ys) else 0

def _bbox(a, thr=200):
    m = a.min(2) < thr
    ys, xs = np.where(m)
    if len(xs) == 0:
        return None
    return (int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max()))


def align_to_original(gimg, orig_rgb):
    """Gemini cikti cercevesini orijinale hizala — SADECE KUCULT (asla buyutme:
    tekerlek orijinal bbox'ini sisirir, buyutmek yan-gorunumde bozar).
    Tetik: (a) sonra kadraja tasiyor (kenara deger) VEYA (b) sonra orijinalden
    UZUN (tekerleksiz araba tekerlekli orijinalden asla uzun olamaz = regresyon).
    Duzeltme: once-bbox genisligine/yuksekligine kucult, ust+yatay-merkeze hizala."""
    ga = np.array(gimg)
    ob = _bbox(orig_rgb); gb = _bbox(ga)
    if ob is None or gb is None:
        return gimg
    ow, oh = ob[1] - ob[0], ob[3] - ob[2]
    gw, gh = gb[1] - gb[0], gb[3] - gb[2]
    H = ga.shape[0]
    overflow = (gb[0] <= 4 or gb[1] >= H - 5) and not (ob[0] <= 4 or ob[1] >= H - 5)
    sx = ow / gw if (overflow and gw > ow) else 1.0     # kadraj: genislige kucult
    sy = oh / gh if gh > oh * 1.04 else 1.0             # regresyon: >%4 uzunsa yukseklige kucult
    s = min(sx, sy)
    if s >= 0.995:                                      # iyi cerceve -> dokunma (idempotent)
        return gimg
    ns = max(1, round(H * s))
    gs = gimg.resize((ns, ns), Image.LANCZOS)
    ocx = (ob[0] + ob[1]) / 2.0                         # once yatay merkez
    gcx = (gb[0] + gb[1]) / 2.0 * s
    offx = round(ocx - gcx)
    offy = round(ob[2] - gb[2] * s)                     # ust kenar hizala
    canvas = Image.new("RGB", (H, H), (255, 255, 255))
    canvas.paste(gs, (offx, offy))
    return canvas


def one(config, renk, tente, fr):
    src = os.path.join(V2, config, renk, tente, f"{fr:02d}.webp")
    if not os.path.exists(src):
        return (renk, tente, fr, "YOK-kaynak")
    outdir = os.path.join(OUTROOT, config, renk, tente)
    os.makedirs(outdir, exist_ok=True)
    dst = os.path.join(outdir, f"{fr:02d}.png")
    try:
        orig = np.array(Image.open(src).convert("RGB"))
        raw = call_gemini(open(src, "rb").read(), "image/webp", prompt(renk, config))
        tmp = dst + ".raw"
        open(tmp, "wb").write(raw)
        g = Image.open(tmp).convert("RGB").resize((1400, 1400), Image.LANCZOS)
        g2 = align_to_original(g, orig)                 # cerceve hizalama (sadece gerekliyse)
        aligned = g2 is not g
        g2.save(dst)
        os.remove(tmp)
        return (renk, tente, fr, "OK" + (" [hizalandi]" if aligned else ""))
    except Exception as e:
        return (renk, tente, fr, f"HATA {str(e)[:80]}")

def main():
    config = sys.argv[1] if len(sys.argv) > 1 else "150-krom-rafli"
    renkler = sys.argv[2].split(",") if len(sys.argv) > 2 else list(DESC)
    tenteler = sys.argv[3].split(",") if len(sys.argv) > 3 else ["tentesiz", "tenteli"]
    frames = [int(x) for x in sys.argv[4].split(",")] if len(sys.argv) > 4 else list(range(1, 8))
    jobs = [(config, r, t, f) for t in tenteler for r in renkler for f in frames]
    print(f"{len(jobs)} is: {config} renk={renkler} tente={tenteler} kare={frames}")
    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = {ex.submit(one, *j): j for j in jobs}
        for fut in as_completed(futs):
            r, t, f, st = fut.result()
            print(f"  {t}/{r}/{f:02d}: {st}")

if __name__ == "__main__":
    main()
