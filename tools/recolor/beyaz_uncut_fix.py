#!/usr/bin/env python3
"""Beyaz tentesiz setleri KIRPMADAN (canny siluet) siyahla AYNI boyuta getirir + sirala.

Sorun: beyaz govde=beyaz zemin -> min-esik ile olculemiyor, onceki yerlestirme kenari kesiyordu.
Cozum: skimage canny beyaz cart tam siluetini (masa uclari dahil) verir -> union bbox sabit crop
(siyah pipeline'inin aynisi) -> cart siyahla ayni fraction (~0.86) -> AYNI boyut, kesiksiz, tutarli.
Sira: mevcut public beyaz slot -> native kare (canny siluet IoU, beyaz-beyaz guvenilir) = pub2nat,
sonra kullanici perm'i (mevcut gorunume gore) uygulanir.
"""
import sys, os
import numpy as np
from PIL import Image
from skimage import feature, color
from scipy import ndimage as ndi

DESK = "C:/Users/kuruyemis/Desktop"
V2 = "public/renders/v2"
OUT = "tools/recolor/_beyaz_uncut/{cfg}"
TARGET_FRAC = 0.86  # siyah cart ~%86 dolduruyor

# cfg -> (native_beyaz_folder, perm|None)  perm: yeni slot(i) <- MEVCUT public slot perm[i]
JOBS = {
    "150-krom-tutamacli": ("TENTESIZ_150KROMTUTAMACLI", [1,3,2,6,5,4,7]),
    "150-pirinc-rafli":   ("TENTESIZ_150PIRINCRAFLI",   None),
    "150-pirinc-tutamacli":("TENTESIZ_150PIRINCTUTAMACLI",[3,1,2,4,5,6,7]),
    "100-krom-rafli":     ("TENTESIZ_100KROMSAPLI",     None),
    "100-pirinc-rafli":   ("TENTESIZ_100PIRINCRAFLI",   None),
    "100-pirinc-tutamacli":("TENTESIZ_100PIRINCTUTAMACLI",[1,3,2,6,5,4,7]),
}

def canny_mask(img):
    g = color.rgb2gray(np.asarray(img.convert("RGB")).astype(float) / 255)
    e = feature.canny(g, sigma=1.5)
    return ndi.binary_fill_holes(ndi.binary_closing(e, iterations=3))

def bbox(m):
    ys, xs = np.where(m)
    return int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())

def norm_sil(img):
    """bbox'a normalize edilmis 96x96 siluet (poz/olcek bagimsiz eslesme)."""
    m = canny_mask(img)
    x0, x1, y0, y1 = bbox(m)
    c = Image.fromarray((m[y0:y1+1, x0:x1+1] * 255).astype("uint8")).resize((96, 96))
    return np.asarray(c) > 127

def iou(a, b):
    u = (a | b).sum()
    return (a & b).sum() / u if u else 0

def _orb_feats(img):
    import cv2
    g = cv2.cvtColor(np.asarray(img.convert("RGB")), cv2.COLOR_RGB2GRAY)
    orb = cv2.ORB_create(nfeatures=1500)
    return orb.detectAndCompute(g, None)

def _orb_score(fa, fb):
    import cv2
    ka, da = fa; kb, db = fb
    if da is None or db is None: return 0
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    m = bf.match(da, db)
    good = [x for x in m if x.distance < 64]
    return len(good)

def pub2nat(cfg, nat_imgs):
    """mevcut public beyaz slot(0..6) -> native kare(0..6). ORB (ayni render, crop farkli) = guvenilir."""
    pub = [Image.open(f"{V2}/{cfg}/beyaz/tentesiz/{i:02d}.webp").convert("RGB") for i in range(1, 8)]
    pf = [_orb_feats(im) for im in pub]
    nf = [_orb_feats(im) for im in nat_imgs]
    pairs = sorted([(_orb_score(pf[p], nf[n]), p, n) for p in range(7) for n in range(7)], reverse=True)
    P = {}; used = set()
    for sc, p, n in pairs:
        if p in P or n in used: continue
        P[p] = n; used.add(n)
    return [P[p] for p in range(7)]

def cart_bbox(img):
    """canny cart bbox + alt koyu golge seridi kirp."""
    a = np.asarray(img.convert("RGB"))
    m = canny_mask(img)
    x0, x1, y0, y1 = bbox(m)
    while y1 > y0 + 50 and a[y1].min(1).mean() < 50:  # neredeyse-siyah golge satiri disla
        y1 -= 1
    return x0, x1, y0, y1

def siyah_slot_bbox(cfg, slot):
    """siyah ayni output-slotunun arac bbox'i (kare-basi hizalama referansi)."""
    a = np.asarray(Image.open(f"{V2}/{cfg}/siyah/tentesiz/{slot:02d}.webp").convert("RGB"))
    m = a.min(2) < 200
    ys, xs = np.where(m)
    y0, y1 = int(ys.min()), int(ys.max())
    while y1 > y0 + 50 and a[y1].min(1).mean() < 30:  # alt golge seridi disla
        y1 -= 1
    return int(xs.min()), int(xs.max()), y0, y1

def process(cfg, folder, perm):
    nat = [Image.open(f"{DESK}/{folder}/{i:02d}.png").convert("RGB") for i in range(1, 8)]
    boxes = [cart_bbox(im) for im in nat]
    order = perm if perm else list(range(1, 8))
    p2n = pub2nat(cfg, nat)
    od = OUT.format(cfg=cfg); os.makedirs(od, exist_ok=True)
    widths = []
    for out_slot in range(7):
        pub_slot = order[out_slot] - 1
        nat_idx = p2n[pub_slot]
        img = nat[nat_idx]; x0, x1, y0, y1 = boxes[nat_idx]
        crop = img.crop((x0, y0, x1 + 1, y1 + 1))
        bw, bh = x1 - x0 + 1, y1 - y0 + 1
        # KARE-BASI: siyah ayni slotun bbox'ina sigacak sekilde olcekle (min oran = kesme yok)
        sx0, sx1, sy0, sy1 = siyah_slot_bbox(cfg, out_slot + 1)
        sw, sh = sx1 - sx0 + 1, sy1 - sy0 + 1
        s = min(sw / bw, sh / bh)
        nw, nh = max(1, round(bw * s)), max(1, round(bh * s))
        crop = crop.resize((nw, nh), Image.LANCZOS)
        cv = Image.new("RGB", (1400, 1400), (255, 255, 255))
        cx, cy = (sx0 + sx1) / 2, (sy0 + sy1) / 2      # siyah arac merkezine hizala
        cv.paste(crop, (round(cx - nw / 2), round(cy - nh / 2)))
        cv.save(f"{od}/{out_slot+1:02d}.webp", "WEBP", quality=90, method=6)
        widths.append(nw)
    return p2n, widths

if __name__ == "__main__":
    only = sys.argv[1] if len(sys.argv) > 1 else None
    for cfg, (folder, perm) in JOBS.items():
        if only and cfg != only: continue
        p2n, widths = process(cfg, folder, perm)
        print(f"{cfg}: pub2nat={[x+1 for x in p2n]} perm={perm} cart_gen={widths}")
