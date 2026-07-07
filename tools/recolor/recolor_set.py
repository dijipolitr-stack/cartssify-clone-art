# DETERMINISTIK renk (ANA YONTEM): siyah render setini yeni renge cevirir.
# Sadece koyu-notr govde/tente pikselleri boyanir (parlakligi/golgeyi koruyarak).
# Yazi (parlak), altin/krom direk, tekerlek, zemin, ACI ve CERCEVE birebir ORIJINAL
# kalir -> hicbir kayma yok, Gemini yok, ton formulle sabit (urunler arasi tutarli).
#
# Kullanim:
#   python recolor_set.py "<siyah_set_klasoru>" <renk> [<cikti_kok>]
# Ornek:
#   python recolor_set.py ".../100CMSIYAHMATPIRINCRAFLI" yesil
import sys, os, json, glob, colorsys
from collections import deque
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))

def recolor_image(path, out, th_deg, ts):
    # Koyu-notr govde/tente maskesi -> baglantili bilesen (sadece BUYUK bilesenler:
    # govde+tente; caster/ince golge elenir) -> bilesen ici derin golge doldurulur.
    # Boylece caster ve zemin golgesi ORIJINAL kalir; ic raf benegi olmaz.
    th = th_deg / 360.0
    im = Image.open(path).convert("RGB")
    w, h = im.size; px = im.load()
    V = [[0.0]*w for _ in range(h)]; mp = [[0]*w for _ in range(h)]
    mp2 = [[0]*w for _ in range(h)]  # genis notr-koyu maskesi (boyama icin)
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            _, s, v = colorsys.rgb_to_hsv(r/255, g/255, b/255)
            V[y][x] = v
            if v < 0.50 and s < 0.35:
                mp[y][x] = 1
            if v < 0.62 and s < 0.45:
                mp2[y][x] = 1
    # baglantili bilesen (downscale)
    SC = 3; sw, sh = w // SC, h // SC
    sm = [[mp[min(y*SC,h-1)][min(x*SC,w-1)] for x in range(sw)] for y in range(sh)]
    # blok-ortalama parlaklik: koyu bloklarda (ic bosluk/jant-arasi) kaynak noise'un
    # ACIK-gri noktalari "acik-mavi benek" yapiyor -> koyu blogu duz tona cek.
    bV = [[0.0]*sw for _ in range(sh)]
    for sy in range(sh):
        ay = sy*SC
        for sx in range(sw):
            ax = sx*SC; tot = 0.0; cnt = 0
            for yy in range(ay, min(ay+SC, h)):
                for xx in range(ax, min(ax+SC, w)):
                    tot += V[yy][xx]; cnt += 1
            bV[sy][sx] = tot/cnt if cnt else 0.0
    lbl = [[0]*sw for _ in range(sh)]; sizes = {}; cur = 0
    for y in range(sh):
        for x in range(sw):
            if sm[y][x] and lbl[y][x] == 0:
                cur += 1; cnt = 0; q = deque([(x, y)]); lbl[y][x] = cur
                while q:
                    cx, cy = q.popleft(); cnt += 1
                    for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                        nx, ny = cx+dx, cy+dy
                        if 0 <= nx < sw and 0 <= ny < sh and sm[ny][nx] and lbl[ny][nx]==0:
                            lbl[ny][nx] = cur; q.append((nx, ny))
                sizes[cur] = cnt
    MIN = int(0.015 * sw * sh)
    keep = {k for k, v in sizes.items() if v >= MIN}
    body = [[1 if lbl[y][x] in keep else 0 for x in range(sw)] for y in range(sh)]
    # Cevrelenmis koyu bolgeleri de boya: dekoratif teker jant-arasi govde koyu
    # dilimlere bolunup buyuk-bilesenden elenir. Kenar-gezinmesi SADECE koyu-notr
    # (sm==1) ve govde-disi hucreler uzerinden yapilir; beyaz teker/krom bariyer olur.
    # -> kenara (golge/caster yoluyla) ulasan koyular ORIJINAL kalir; beyaz teker
    #    tarafindan cevrelenip kenara ulasamayan jant-arasi govde BOYANIR.
    vis = [[0]*sw for _ in range(sh)]; q = deque()
    def seed(x, y):
        if sm[y][x] and not body[y][x] and not vis[y][x]:
            vis[y][x]=1; q.append((x,y))
    for x in range(sw):
        seed(x, 0); seed(x, sh-1)
    for y in range(sh):
        seed(0, y); seed(sw-1, y)
    while q:
        cx, cy = q.popleft()
        for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
            nx, ny = cx+dx, cy+dy
            if 0 <= nx < sw and 0 <= ny < sh and sm[ny][nx] and not body[ny][nx] and not vis[ny][nx]:
                vis[ny][nx]=1; q.append((nx,ny))
    region = [[(body[y][x] or (sm[y][x] and not vis[y][x])) for x in range(sw)] for y in range(sh)]
    # boya. Koyu govde/ic-bosluk pikselleri (V<0.40) DUZ tek-ton lacivert olur:
    # kaynak V-Ray noise'u siyahta gorunmuyordu, renge cevirince "benek" yapiyordu
    # (ic dolap bosluğu, jant-arasi). Duz-fill benegi tamamen yutar. Aydinlik yuzeyler
    # (V>=0.40) parlaklik-koruyan kalir -> yumusak govde gradyani. Logo/krom/raf korunur.
    # FARKLI YOL: cok koyu ic bosluk (bV<0.30) kaynak V-Ray noise'lu -> boyamadan
    # ONCE bu bolgeyi guclu blur ile pukuzsuzlestir (gurultu kaynakta erir). Blur'lu
    # parlaklikla boyaninca pürüzsüz koyu golge; rafin kaba formu korunur, benek yok.
    from PIL import ImageFilter
    blur = im.filter(ImageFilter.GaussianBlur(6)); bpx = blur.load()
    o = Image.new("RGB", (w, h)); op = o.load()
    for y in range(h):
        sy = min(y // SC, sh-1)
        for x in range(w):
            sx = min(x // SC, sw-1)
            if region[sy][sx] and bV[sy][sx] < 0.30:
                # blur'lu kaynaktan parlaklik al -> pürüzsüz
                br, bg, bb = bpx[x, y]
                _, _, bv = colorsys.rgb_to_hsv(br/255, bg/255, bb/255)
                nv = min(1.0, 0.30 + bv * 0.70)
                nr, ng, nb = colorsys.hsv_to_rgb(th, ts, nv)
                op[x, y] = (int(nr*255), int(ng*255), int(nb*255))
            elif region[sy][sx] and (mp2[y][x] or V[y][x] < 0.30):
                nv = min(1.0, 0.28 + V[y][x] * 0.85)
                nr, ng, nb = colorsys.hsv_to_rgb(th, ts, nv)
                op[x, y] = (int(nr*255), int(ng*255), int(nb*255))
            else:
                op[x, y] = px[x, y]
    o.save(out)

def main():
    if len(sys.argv) < 3:
        sys.exit('kullanim: python recolor_set.py "<siyah_set>" <renk> [<cikti_kok>]')
    set_dir = sys.argv[1]; color = sys.argv[2].lower()
    out_root = sys.argv[3] if len(sys.argv) > 3 else os.path.join(HERE, "cikti")
    with open(os.path.join(HERE, "palette.json"), encoding="utf-8") as fh:
        palette = json.load(fh)
    if color not in palette:
        sys.exit(f"'{color}' palette'te yok. Mevcut: {[k for k in palette if not k.startswith('_')]}")
    e = palette[color]
    imgs = sorted(glob.glob(os.path.join(set_dir, "*.png")))
    if not imgs:
        sys.exit(f"gorsel yok: {set_dir}")
    set_name = os.path.basename(os.path.normpath(set_dir))
    final_dir = os.path.join(out_root, color, set_name)
    os.makedirs(final_dir, exist_ok=True)
    print(f"[{set_name}] {color} (hue={e['hue']} sat={e['sat']}) -> {len(imgs)} gorsel")
    for i, src in enumerate(imgs, 1):
        recolor_image(src, os.path.join(final_dir, f"{i:02d}.png"), e["hue"], e["sat"])
        print(f"  {i}/{len(imgs)} ok")
    print(f"BITTI -> {final_dir}")

if __name__ == "__main__":
    main()
