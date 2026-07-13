#!/usr/bin/env python3
"""Beyaz TEKERSIZ (tekeryok) karelerin kadrajini SIYAH tekersize hizalar.

Sorun: beyaz tekersiz kareler ayri islemle uretildi, olcek siyaha normalize
edilmedi -> arac buyuk/kaymis (kadraj sorunu). Tekerlekli beyaz DOGRU.
Cozum: mevcut beyaz tekersiz webp'i canny bbox ile olc, SABIT olcek
(siyah_target_w / beyaz_max_w) ile kucult, her kareyi SIYAH ayni karenin
arac-merkezine yerlestir. Kredi/uretim yok, sadece yeniden olcekleme.
"""
import sys, os
import numpy as np
from PIL import Image
from skimage import feature, color
from scipy import ndimage as ndi

V2 = "public/renders/v2"
CONFIGS = ["100-krom-rafli", "100-pirinc-rafli"]


def canny_bbox(img):
    """beyaz-zemin uzerindeki beyaz arac icin canny siluet bbox (masa uclari dahil)."""
    g = color.rgb2gray(np.asarray(img.convert("RGB")).astype(float) / 255)
    e = feature.canny(g, sigma=1.5)
    m = ndi.binary_fill_holes(ndi.binary_closing(e, iterations=3))
    ys, xs = np.where(m)
    a = np.asarray(img.convert("RGB"))
    y0, y1 = int(ys.min()), int(ys.max())
    x0, x1 = int(xs.min()), int(xs.max())
    while y1 > y0 + 50 and a[y1].min(1).mean() < 50:  # alt koyu golge seridi
        y1 -= 1
    return x0, x1, y0, y1


def siyah_bbox(img):
    """siyah arac beyaz zeminde: min(RGB)<200 maskesi guvenilir."""
    a = np.asarray(img.convert("RGB"))
    m = a.min(2) < 200
    ys, xs = np.where(m)
    y0, y1 = int(ys.min()), int(ys.max())
    while y1 > y0 + 50 and a[y1].min(1).mean() < 30:
        y1 -= 1
    return int(xs.min()), int(xs.max()), y0, y1


def process(cfg, apply=False):
    # siyah tekersiz referans: per-kare bbox -> target genislik (max) + arac merkezleri
    sib = []
    for i in range(1, 8):
        im = Image.open(f"{V2}/{cfg}/siyah/tentesiz/tekeryok/{i:02d}.webp")
        sib.append(siyah_bbox(im))
    target_w = max(b[1] - b[0] for b in sib)
    sc = [((b[0] + b[1]) / 2, (b[2] + b[3]) / 2) for b in sib]  # siyah arac merkezleri

    # beyaz tekersiz mevcut: per-kare canny bbox -> en genis (sabit olcek icin)
    bey = [Image.open(f"{V2}/{cfg}/beyaz/tentesiz/tekeryok/{i:02d}.webp").convert("RGB") for i in range(1, 8)]
    bb = [canny_bbox(im) for im in bey]
    beyaz_max = max(b[1] - b[0] for b in bb)
    scale = target_w / beyaz_max

    print(f"\n{cfg}: siyah_target_w={target_w}  beyaz_max_w={beyaz_max}  scale={scale:.4f}")
    for i in range(7):
        bw = bb[i][1] - bb[i][0]
        print(f"  kare{i+1}: beyaz_w={bw} -> {round(bw*scale)}  siyah_w={sib[i][1]-sib[i][0]}"
              f"  merkez siyah=({sc[i][0]:.0f},{sc[i][1]:.0f})")

    if not apply:
        return
    for i in range(7):
        x0, x1, y0, y1 = bb[i]
        crop = bey[i].crop((x0, y0, x1 + 1, y1 + 1))
        nw = max(1, round((x1 - x0 + 1) * scale))
        nh = max(1, round((y1 - y0 + 1) * scale))
        crop = crop.resize((nw, nh), Image.LANCZOS)
        cv = Image.new("RGB", (1400, 1400), (255, 255, 255))
        cx, cy = sc[i]  # siyah ayni karenin merkezine hizala
        cv.paste(crop, (round(cx - nw / 2), round(cy - nh / 2)))
        cv.save(f"{V2}/{cfg}/beyaz/tentesiz/tekeryok/{i+1:02d}.webp", "WEBP", quality=90, method=6)
    print(f"  -> YAZILDI ({cfg})")


if __name__ == "__main__":
    apply = "--apply" in sys.argv
    only = next((a for a in sys.argv[1:] if not a.startswith("--")), None)
    for cfg in CONFIGS:
        if only and cfg != only:
            continue
        process(cfg, apply=apply)
