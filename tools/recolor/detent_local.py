# Tente + 4 direk YEREL silme (Gemini YOK, govde piksel-piksel korunur).
# Yontem:
#  1) Yatay ACILIM (opening) ile ince krom direkler maskeden silinir.
#  2) Satir-genislik "bel"i -> tezgah arka kenari yaklasik satiri (cut_row).
#  3) Tezgah arka kenari noktalarina ROBUST DUZ CIZGI fit edilir (outlier atilir).
#     Duz cizgi: ne direk gudugu ne tezgaha oyulmus centik birakir; egim dogal cozulur.
#  4) Cizginin ustu KOSE arka plan rengiyle (temiz beyaz) doldurulur.
# Kullanim: python detent_local.py <in.png> <out.png>
import sys, numpy as np
from PIL import Image

im = np.asarray(Image.open(sys.argv[1]).convert("RGB")).astype(np.int16)
H, W, _ = im.shape
mx = im.max(2); mn = im.min(2)
notbg = (mx < 228) | ((mx - mn) > 20)

# 1) Yatay acilim: ince dikey yapilar (direkler ~10-15px) silinir, genis tezgah/kabin kalir.
K = 27; r = K // 2
er = notbg.copy()
for d in range(1, r + 1):
    er[:, d:] &= notbg[:, :-d]
    er[:, :-d] &= notbg[:, d:]
op = er.copy()
for d in range(1, r + 1):
    op[:, d:] |= er[:, :-d]
    op[:, :-d] |= er[:, d:]

w = op.sum(1).astype(np.float32)
ys = np.nonzero(w > 0)[0]
if ys.size == 0:
    Image.fromarray(np.clip(im, 0, 255).astype(np.uint8), "RGB").save(sys.argv[2])
    print("bos"); sys.exit()
top_c, bot_c = int(ys[0]), int(ys[-1])

# 2) Bel: kabin ortasindan yukari cik, ilk dar satir = tezgah arka kenari yaklasigi.
lo = int(H * 0.45)
cab_slice = w[lo:bot_c + 1]
cabmax = float(cab_slice.max())
ymax = lo + int(np.argmax(cab_slice))
narrow = cabmax * 0.45
y = ymax
while y > top_c and w[y] >= narrow:
    y -= 1
cut_row = y

# 3) Tezgah arka kenari noktalari: her sutunun acilimli maskede EN UST pikseli,
#    cut_row civarindakiler (direk/tente/raf disi) secilir; robust duz cizgi fit.
h = np.full(W, -1, dtype=np.int32)
for x in range(W):
    col = op[:, x]
    yy = np.nonzero(col)[0]
    if yy.size:
        h[x] = int(yy[0])
xs = np.arange(W)
sel = (h >= 0) & (np.abs(h - cut_row) < 45)
X = xs[sel].astype(np.float64); Y = h[sel].astype(np.float64)
a, b = np.polyfit(X, Y, 1)
for _ in range(4):
    res = np.abs(a * X + b - Y)
    keep = res < 10
    if keep.sum() < 25:
        break
    a, b = np.polyfit(X[keep], Y[keep], 1)
# Fit dogrulama: kalin direkli yan aciler (07) fit'i bozar -> yatay cut_row'a dus.
yl = a * xs + b
med_res = float(np.median(np.abs(a * X + b - Y)))
if abs(a) > 0.09 or (yl.max() - yl.min()) > 85 or med_res > 7:
    a, b = 0.0, float(cut_row)              # guvenli yatay kesim (counter ustu)
    yl = a * xs + b
yline = yl + 2                              # tezgah kenarinin 2px altindan kes
cut = np.clip(np.round(yline), 0, H).astype(np.int32)

# 4) Kose arka plan rengiyle (temiz beyaz) doldur.
c1 = im[3:20, 3:20, :].reshape(-1, 3)
c2 = im[3:20, W - 20:W - 3, :].reshape(-1, 3)
c3 = im[H - 20:H - 3, 3:20, :].reshape(-1, 3)
c4 = im[H - 20:H - 3, W - 20:W - 3, :].reshape(-1, 3)
bg = np.median(np.concatenate([c1, c2, c3, c4], axis=0), axis=0)
out = im.copy().astype(np.float32)
for x in range(W):
    c = int(cut[x])
    if c > 0:
        out[:c, x, :] = bg

# Flans temizleme: tezgah ust yuzeyinde kalan direk-dibi KROM (gri) gudukleri,
# SUTUN-BAZLI band [cut[x]-4, cut[x]+48] icinde AYNI SATIRDA yatay mavi komsuyla
# doldur (golge tonu korunur; acik kapak/karanlik ic mekandan etkilenmez).
# Tekerlek/kulp/kaster cok asagida (band disi) -> dokunulmaz.
blue = ((im[:, :, 2] - im[:, :, 0]) > 18) & notbg   # tezgah mavisi
metal = notbg & ((im[:, :, 2] - im[:, :, 0]) < 15)  # mavi-olmayan (krom flans/parlak)
for x in range(W):
    c = int(cut[x])
    for y in range(max(0, c - 4), min(H, c + 48)):
        if not metal[y, x]:
            continue
        fill = None
        for dx in range(2, 70):               # ayni satirda en yakin mavi komsu
            if x + dx < W and blue[y, x + dx]:
                fill = im[y, x + dx, :]; break
            if x - dx >= 0 and blue[y, x - dx]:
                fill = im[y, x - dx, :]; break
        if fill is not None:
            out[y, x, :] = fill
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGB").save(sys.argv[2])
print(f"cut_row={cut_row} slope={a:.3f} cut med={int(np.median(cut))} min={int(cut.min())} max={int(cut.max())}")
