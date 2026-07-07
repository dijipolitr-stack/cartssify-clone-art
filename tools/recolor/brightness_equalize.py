# Set-ici PARLAKLIK esitleme (numpy, hizli): klasordeki tum gorsellerin govde ortalama
# parlakligini setin MEDYANINA ceker. Ton/doygunluk degismez (govde piksellerini ayni
# oranda olceklemek = HSV'de V olcekleme). Golge goreli korunur.
# Kullanim: python brightness_equalize.py <klasor>
import sys, glob, os
import numpy as np
from PIL import Image

FOLDER = sys.argv[1]
# opsiyonel sabit hedef parlaklik (palette'ten); yoksa setin medyani kullanilir
TARGET_V = float(sys.argv[2]) if len(sys.argv) > 2 else None
files = sorted(glob.glob(os.path.join(FOLDER, "*.png")))

def body_mask_and_meanV(rgb):
    mx = rgb.max(2).astype(np.float32); mn = rgb.min(2).astype(np.float32)
    m = (mx - mn >= 22) & (mn <= 150)
    meanV = (mx[m].mean() / 255.0) if m.any() else None
    return m, meanV

arrs = {}; means = {}
for f in files:
    rgb = np.asarray(Image.open(f).convert("RGB"), dtype=np.uint8)
    m, mv = body_mask_and_meanV(rgb)
    if mv is not None:
        arrs[f] = (rgb, m); means[f] = mv
if not means:
    sys.exit("govde pikseli bulunamadi")
vals = sorted(means.values())
target = TARGET_V if TARGET_V is not None else vals[len(vals)//2]
print(f"hedef parlaklik V = {target:.3f}" + ("" if TARGET_V is None else " (palette sabit)"))

for f in files:
    if f not in means:
        continue
    fac = target / means[f]
    if abs(fac - 1.0) < 0.03:
        print(f"{os.path.basename(f)}  V={means[f]:.3f}  (degismedi)")
        continue
    rgb, m = arrs[f]
    out = rgb.astype(np.float32)
    out[m] = np.clip(out[m] * fac, 0, 255)
    Image.fromarray(out.astype(np.uint8), "RGB").save(f)
    print(f"{os.path.basename(f)}  V={means[f]:.3f} -> {target:.3f} (fac={fac:.3f})")
