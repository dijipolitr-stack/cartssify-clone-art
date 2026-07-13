#!/usr/bin/env python3
"""Kullanicinin Gemini web'de SIYAHTAN urettigi beyaz kareleri (rastgele isimli)
siyahla esleyip (siluet IoU) dogru siraya + siyah boyutuna hizalayarak public'e yazar.

Uretim YOK — sadece esleme + olcek/hiza. Siyahtan uretildikleri icin geometri
siyahla ayni => siluet IoU esleme guvenilir.
"""
import os, sys, glob
import numpy as np
from PIL import Image
from skimage import feature, color
from scipy import ndimage as ndi

BASE = "C:/Users/kuruyemis/Desktop/RUMICARTS_BEYAZ_YAPILACAK"
V2 = "public/renders/v2"

# config -> (kullanici_klasoru, siyah_alt_yol, cikti_alt_yol)
JOBS = {
    "100-krom-rafli":       ("100-krom-rafli_TEKERSIZ",       "siyah/tentesiz/tekeryok", "beyaz/tentesiz/tekeryok"),
    "100-pirinc-rafli":     ("100-pirinc-rafli_TEKERSIZ",     "siyah/tentesiz/tekeryok", "beyaz/tentesiz/tekeryok"),
    "150-pirinc-tutamacli": ("150-pirinc-tutamacli_TENTESIZ", "siyah/tentesiz",          "beyaz/tentesiz"),
}

# GOZLE eslenmis sira: slot(0..6) -> isim-sirali dosya index(0..6).
# Otomatik siluet/gradyan guvenilmez oldugu icin elle belirlendi (logo yuzu vs kapak yuzu + aci).
MANUAL = {
    "100-krom-rafli":       {0: 1, 1: 3, 2: 5, 3: 2, 4: 0, 5: 6, 6: 4},
    "100-pirinc-rafli":     {0: 1, 1: 3, 2: 5, 3: 2, 4: 0, 5: 6, 6: 4},
    "150-pirinc-tutamacli": {0: 0, 1: 4, 2: 6, 3: 5, 4: 1, 5: 2, 6: 3},
}


def white_mask(img):
    g = color.rgb2gray(np.asarray(img.convert("RGB")).astype(float) / 255)
    e = feature.canny(g, sigma=1.5)
    return ndi.binary_fill_holes(ndi.binary_closing(e, iterations=3))


def black_mask(img):
    a = np.asarray(img.convert("RGB"))
    return a.min(2) < 200


def bbox(m):
    ys, xs = np.where(m)
    return int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())


def sil96(m):
    x0, x1, y0, y1 = bbox(m)
    c = Image.fromarray((m[y0:y1+1, x0:x1+1] * 255).astype("uint8")).resize((96, 96))
    return np.asarray(c) > 127


def iou(a, b):
    u = (a | b).sum()
    return (a & b).sum() / u if u else 0


def grad_feat(img, mask):
    """arac bbox'ina normalize edilmis gradyan-buyuklugu haritasi (ic yapi = aci imzasi).
    siyah/beyaz fark etmez: kenarlar (logo, kapak, tutamac, tekerlek) ayni yerde."""
    x0, x1, y0, y1 = bbox(mask)
    g = np.asarray(img.convert("L").crop((x0, y0, x1 + 1, y1 + 1)).resize((160, 160))).astype(float)
    gx = np.abs(np.diff(g, axis=1, prepend=g[:, :1]))
    gy = np.abs(np.diff(g, axis=0, prepend=g[:1, :]))
    mag = np.sqrt(gx * gx + gy * gy)
    mag -= mag.mean()
    n = np.linalg.norm(mag)
    return mag / n if n else mag


def ncc(a, b):
    return float((a * b).sum())


def black_bbox_trim(img):
    """siyah bbox, alt koyu golge seridini disla."""
    a = np.asarray(img.convert("RGB"))
    x0, x1, y0, y1 = bbox(black_mask(img))
    while y1 > y0 + 50 and a[y1].min(1).mean() < 30:
        y1 -= 1
    return x0, x1, y0, y1


def white_bbox_trim(img):
    a = np.asarray(img.convert("RGB"))
    x0, x1, y0, y1 = bbox(white_mask(img))
    while y1 > y0 + 50 and a[y1].min(1).mean() < 50:
        y1 -= 1
    return x0, x1, y0, y1


def process(cfg, apply=False):
    ufolder, sisub, outsub = JOBS[cfg]
    ufiles = sorted(glob.glob(f"{BASE}/{ufolder}/2_BEYAZ_buraya_koy/*.png") +
                    glob.glob(f"{BASE}/{ufolder}/2_BEYAZ_buraya_koy/*.webp") +
                    glob.glob(f"{BASE}/{ufolder}/2_BEYAZ_buraya_koy/*.jpg"))
    if len(ufiles) != 7:
        print(f"!! {cfg}: {len(ufiles)} dosya (7 olmali) — atlaniyor")
        return
    uimgs = [Image.open(f).convert("RGB") for f in ufiles]
    ufeat = [grad_feat(im, white_mask(im)) for im in uimgs]
    siyah = [Image.open(f"{V2}/{cfg}/{sisub}/{i:02d}.webp").convert("RGB") for i in range(1, 8)]
    sfeat = [grad_feat(im, black_mask(im)) for im in siyah]

    if cfg in MANUAL:
        slot2u = dict(MANUAL[cfg])
        mode = "ELLE"
    else:
        pairs = sorted([(ncc(sfeat[s], ufeat[u]), s, u) for s in range(7) for u in range(7)], reverse=True)
        slot2u = {}; usedu = set()
        for sc, s, u in pairs:
            if s in slot2u or u in usedu:
                continue
            slot2u[s] = u; usedu.add(u)
        mode = "OTO"

    print(f"\n{cfg}: esleme ({mode}) slot<-dosya")
    for s in range(7):
        u = slot2u[s]
        print(f"  slot{s+1:02d} <- {os.path.basename(ufiles[u])[:28]}")

    if not apply:
        return
    outdir = f"{V2}/{cfg}/{outsub}"
    os.makedirs(outdir, exist_ok=True)
    for s in range(7):
        u = slot2u[s]
        im = uimgs[u]
        wx0, wx1, wy0, wy1 = white_bbox_trim(im)
        crop = im.crop((wx0, wy0, wx1 + 1, wy1 + 1))
        bw, bh = wx1 - wx0 + 1, wy1 - wy0 + 1
        sx0, sx1, sy0, sy1 = black_bbox_trim(siyah[s])
        sw, sh = sx1 - sx0 + 1, sy1 - sy0 + 1
        sc = min(sw / bw, sh / bh)
        nw, nh = max(1, round(bw * sc)), max(1, round(bh * sc))
        crop = crop.resize((nw, nh), Image.LANCZOS)
        cv = Image.new("RGB", (1400, 1400), (255, 255, 255))
        cx, cy = (sx0 + sx1) / 2, (sy0 + sy1) / 2
        cv.paste(crop, (round(cx - nw / 2), round(cy - nh / 2)))
        cv.save(f"{outdir}/{s+1:02d}.webp", "WEBP", quality=90, method=6)
    print(f"  -> YAZILDI: {outdir}")


if __name__ == "__main__":
    apply = "--apply" in sys.argv
    only = next((a for a in sys.argv[1:] if not a.startswith("--")), None)
    for cfg in JOBS:
        if only and cfg != only:
            continue
        process(cfg, apply=apply)
