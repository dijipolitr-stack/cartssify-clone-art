#!/usr/bin/env python3
"""Buyuk on tekerlegi + krom fender kavsini siler (dekoratif tekerleksiz varyant).

Yontem (memory rumicarts-tekerleksiz-kutuphane):
- Maske SIYAH kareden bir kez cikarilir (tekerlek/fender = parlak pikseller), 5 renge AYNEN uygulanir.
- Govde bolgesi (y < body_edge): satir-bazli KENDI govde rengiyle doldurulur.
- Zemin bolgesi (y >= body_edge): beyaz yapilir; kose caster + golge KORUNUR.

Kullanim: python dewheel.py <config_dir> [--frame 01]
  config_dir: public/renders/v2/<config>  (altinda <renk>/<tente>/NN.webp)
Pilot: tek frame, 5 renk, tentesiz.
"""
import sys, os
import numpy as np
from PIL import Image

RENKLER = ["siyah", "mavi", "kirmizi", "yesil", "beyaz"]

# --- 150-krom-rafli / tentesiz / frame 01 geometrisi (1400x1400) ---
# Tekerlek + fender kutusu ve govde alt kenari bu frame'e ozgu.
GEO = {
    "body_edge": 947,          # govde alt kenari (siyah->beyaz zemin)
    "box": (788, 1128, 658, 1022),  # tekerlek+fender arama kutusu x0,x1,y0,y1
    "floor_x": (792, 1058),    # zemin beyaz seridi x araligi (sag caster x>=1060 korunur)
    "floor_y1": 1020,          # zemin seridi alt siniri
    "clean_col": (600, 782),   # temiz govde ornekleme bandi (logo altinda, tekerlek solunda)
}


def build_wheel_mask(black_rgb, geo):
    """Siyah kareden tekerlek+fender maskesi = DOLU disk+kavis (butun bolge)."""
    from scipy.ndimage import binary_dilation, binary_closing, binary_fill_holes
    a = black_rgb
    h, w = a.shape[:2]
    x0, x1, y0, y1 = geo["box"]
    be = geo["body_edge"]
    mn = a.min(axis=2)
    m = np.zeros((h, w), bool)
    reg = np.zeros((h, w), bool)
    reg[y0:y1, x0:x1] = True
    m |= reg & (mn > 55)               # parlak jant/parmak/fender/zemin-alti
    # zemin bolgesindeki beyaz zemini maskeden dusur (parlak ama tekerlek degil):
    # sadece tekerlek diski + fender kalsin -> once govde bolgesinde kapat/doldur
    m = binary_closing(m, iterations=8)
    m = binary_fill_holes(m)           # jant halkasi kapali -> disk dolar
    m = binary_dilation(m, iterations=11)  # fender halesi + tekerlegin govdeye dusen soft golgesini de yut
    # sag caster'i KORU: zemin satirlarinda maskeyi caster'dan uzak tut
    fx1 = geo["floor_x"][1]
    m[be:, fx1:] = False
    m &= reg                           # kutu disina tasma
    return m


def _hseed(out, a, mask):
    """Yatay lineer interp tohumu (difuzyona hizli baslangic)."""
    for y in np.where(mask.any(axis=1))[0]:
        xs = np.where(mask[y])[0]
        for seg in np.split(xs, np.where(np.diff(xs) > 1)[0] + 1):
            xL, xR = seg[0], seg[-1]
            aL, aR = xL - 1, xR + 1
            if aL < 0 or aR >= a.shape[1] or mask[y, aL] or mask[y, aR]:
                continue
            cL, cR = out[y, aL], out[y, aR]
            n = xR - xL + 1
            t = (np.arange(n) + 1) / (n + 1)
            out[y, xL:xR + 1] = cL[None] * (1 - t)[:, None] + cR[None] * t[:, None]


def _diffuse(out, mask, y0, y1, x0, x1, iters=600):
    """Harmonik (Laplace) inpaint penceresi — yonsuz pürüzsüz gradyan."""
    win = out[y0:y1, x0:x1]
    wm = mask[y0:y1, x0:x1]
    if not wm.any():
        return
    for _ in range(iters):
        nb = np.zeros_like(win)
        nb[1:-1] += win[:-2] + win[2:]
        nb[:, 1:-1] += win[:, :-2] + win[:, 2:]
        cnt = np.zeros(win.shape[:2], np.float32)
        cnt[1:-1] += 2; cnt[:, 1:-1] += 2
        avg = nb / np.clip(cnt[..., None], 1, None)
        win[wm] = avg[wm]
    out[y0:y1, x0:x1] = win


def inpaint_h(a, mask, geo):
    """Govde ve zemin AYRI doldurulur (sert alt kenar korunur):
    - govde bolgesi (y<be): yatay interp tohum + difuzyon (kendi penceresinde, zemin karismaz)
    - zemin bolgesi (y>=be): duz beyaz (zemin zaten beyaz)."""
    out = a.copy().astype(np.float32)
    be = geo["body_edge"]
    m_body = mask.copy(); m_body[be:] = False
    m_floor = mask.copy(); m_floor[:be] = False
    # GOVDE
    _hseed(out, a, m_body)
    ys, xs = np.where(m_body)
    if len(ys):
        _diffuse(out, m_body, ys.min() - 2, be, xs.min() - 2, xs.max() + 3, iters=600)
    # ZEMIN: yatay interp (zemin gölge gradyanini korur, saf-beyaz blok olmaz)
    _hseed(out, a, m_floor)
    return np.clip(out, 0, 255).astype(np.uint8)


def process(config_dir, geo, frame="01", tente="tentesiz"):
    black = np.array(Image.open(os.path.join(config_dir, "siyah", tente, f"{frame}.webp")).convert("RGB"))
    mask = build_wheel_mask(black, geo)
    outdir = os.path.join(os.path.dirname(config_dir.rstrip("/\\")), "_dewheel_pilot")
    os.makedirs(outdir, exist_ok=True)
    # maskeyi de kaydet (QA)
    Image.fromarray((mask * 255).astype(np.uint8)).save(os.path.join(outdir, f"_mask_{os.path.basename(config_dir)}_{frame}.png"))
    for renk in RENKLER:
        p = os.path.join(config_dir, renk, tente, f"{frame}.webp")
        if not os.path.exists(p):
            print("YOK:", p); continue
        a = np.array(Image.open(p).convert("RGB"))
        out = inpaint_h(a, mask, geo)
        dst = os.path.join(outdir, f"{os.path.basename(config_dir)}_{renk}_{frame}.png")
        Image.fromarray(out).save(dst)
        print("OK:", dst)


if __name__ == "__main__":
    cfg = sys.argv[1] if len(sys.argv) > 1 else "public/renders/v2/150-krom-rafli"
    frame = sys.argv[sys.argv.index("--frame") + 1] if "--frame" in sys.argv else "01"
    process(cfg, GEO, frame)
