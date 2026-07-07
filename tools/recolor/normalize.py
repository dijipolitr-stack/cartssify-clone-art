# Gemini ciktisindaki govde/tente rengini SABIT hedef tona kilitler (numpy, hizli).
# Sadece HEDEF RENGE YAKIN pikseller sabitlenir: ton hedefe, doygunluk hedefe, parlaklik
# (V) korunur. Notr (krom/beyaz/yazi) ve farkli renk (pirinc sarisi) dokunulmaz.
# Maskesiz pikseller ORIJINAL RGB'den birebir gelir (yuvarlama kaymasi olmaz).
# Kullanim: python normalize.py <src> <dst> <hue_derece> <sat_0-1> [band_derece=38]
import sys, glob, os
import numpy as np
from PIL import Image

SRC, DST = sys.argv[1], sys.argv[2]
TH_DEG = float(sys.argv[3]); TS = float(sys.argv[4])
BAND = float(sys.argv[5]) if len(sys.argv) > 5 else 38.0
os.makedirs(DST, exist_ok=True)

newH = int(round(TH_DEG * 255 / 360)) % 256
newS = int(round(TS * 255))

for f in sorted(glob.glob(os.path.join(SRC, "*.png"))):
    im = Image.open(f).convert("RGB")
    rgb = np.asarray(im, dtype=np.uint8)
    hsv = np.asarray(im.convert("HSV"), dtype=np.uint8)
    H, S = hsv[..., 0].astype(np.float32), hsv[..., 1].astype(np.float32)
    h_deg = H * 360.0 / 255.0
    d = np.abs(h_deg - TH_DEG) % 360.0
    hdist = np.minimum(d, 360.0 - d)
    mask = (S / 255.0 >= 0.18) & (hdist <= BAND)
    hsv2 = hsv.copy()
    hsv2[..., 0][mask] = newH
    hsv2[..., 1][mask] = newS
    rgb2 = np.asarray(Image.fromarray(hsv2, "HSV").convert("RGB"), dtype=np.uint8)
    out = np.where(mask[..., None], rgb2, rgb).astype(np.uint8)  # maskesiz = orijinal
    Image.fromarray(out, "RGB").save(os.path.join(DST, os.path.basename(f)))
    print(f"{os.path.basename(f):16s} -> {int(mask.sum())} govde pikseli sabitlendi")
