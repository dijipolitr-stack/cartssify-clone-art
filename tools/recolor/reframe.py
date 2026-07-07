# Kanonik cerceve: Gemini ciktisini (piksellerine dokunmadan) orijinal render'in
# arac kutusuna (bbox) oturtur. Boylece her renk/acinin cercevesi orijinalle ve
# birbiriyle birebir hizali olur (Gemini'nin cerceve kaymasi giderilir).
# Kullanim: python reframe.py <orijinal> <gemini_cikti> <out>
import sys
from PIL import Image

ORIG, GEM, OUT = sys.argv[1], sys.argv[2], sys.argv[3]

def cart_bbox(im, thr=238, step=2):
    g = im.convert("L"); w, h = im.size; px = g.load()
    minx, miny, maxx, maxy = w, h, 0, 0
    for y in range(0, h, step):
        for x in range(0, w, step):
            if px[x, y] < thr:
                minx = min(minx, x); maxx = max(maxx, x)
                miny = min(miny, y); maxy = max(maxy, y)
    return (minx, miny, maxx, maxy)

orig = Image.open(ORIG).convert("RGB")
gem = Image.open(GEM).convert("RGB")
ob, gb = cart_bbox(orig), cart_bbox(gem)
obh = ob[3] - ob[1]; gbh = gb[3] - gb[1]
scale = obh / max(1, gbh)
ng = gem.resize((max(1, int(gem.width*scale)), max(1, int(gem.height*scale))))
gb2 = tuple(int(v*scale) for v in gb)
paste_x = (ob[0]+ob[2])//2 - (gb2[0]+gb2[2])//2   # ust-orta hiza
paste_y = ob[1] - gb2[1]
canvas = Image.new("RGB", orig.size, (255, 255, 255))
canvas.paste(ng, (paste_x, paste_y))
canvas.save(OUT)
