# Bir urun setini (klasordeki tum gorseller) tek bir renge cevirir:
#   1) Gemini ile uretken recolor (govde+tente),
#   2) tonu palette'teki sabit hedefe normalize (urunler arasi tutarli).
#
# Kullanim:
#   python pipeline.py <set_klasoru> <renk> [<cikti_kok>]
# Ornek:
#   python pipeline.py ".../100CMSIYAHMATKROMRAFLI" yesil
#
# GEMINI_API_KEY env'de yoksa master.env'den okunur.
import sys, os, json, glob, subprocess, tempfile, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
MASTER_ENV = os.path.join(HERE, "..", "..", "..", "..", "_knowledge", "credentials", "master.env")

BASE_PROMPT = (
    "This is a strict selective recolor task. Keep the image 100% identical to the input, "
    "changing ONLY the paint color of the cart's body panels and the fabric awning to {DESC}. "
    "ABSOLUTELY DO NOT redraw, move, blur or alter anything else. Preserve PIXEL-FOR-PIXEL and "
    "perfectly legible: every text and logo (the large 'RUMICARTS' wordmark AND the small subtitle "
    "line). Keep EVERY metal part in its ORIGINAL color and finish — the vertical poles, the spoked "
    "wheel (its exact shape, rim and spokes), the shelf brackets and the lock (whether they are "
    "chrome/steel silver OR brass/gold, do not change their metal color). Keep the casters, the white "
    "studio background, the camera angle, lighting and all reflections identical. ONLY the matte "
    "painted body panels and the fabric awning change color. Output only the edited image."
)

def load_key():
    k = os.environ.get("GEMINI_API_KEY")
    if k:
        return k
    try:
        with open(MASTER_ENV, encoding="utf-8") as fh:
            for line in fh:
                if line.startswith("GEMINI_API_KEY="):
                    return line.split("=", 1)[1].strip()
    except FileNotFoundError:
        pass
    sys.exit("GEMINI_API_KEY bulunamadi (env veya master.env).")

def main():
    if len(sys.argv) < 3:
        sys.exit("kullanim: python pipeline.py <set_klasoru> <renk> [<cikti_kok>]")
    set_dir = sys.argv[1]
    color = sys.argv[2].lower()
    out_root = sys.argv[3] if len(sys.argv) > 3 else os.path.join(HERE, "cikti")

    with open(os.path.join(HERE, "palette.json"), encoding="utf-8") as fh:
        palette = json.load(fh)
    if color not in palette:
        sys.exit(f"'{color}' palette'te yok. Mevcut: {[k for k in palette if not k.startswith('_')]}")
    entry = palette[color]
    prompt = BASE_PROMPT.replace("{DESC}", entry["prompt"])

    set_name = os.path.basename(os.path.normpath(set_dir))
    # klasor adina gore metal vurgusu (Gemini pirinci gumusluyor / krom yesillenebiliyor)
    nu = set_name.upper()
    if "PIRIN" in nu or "PİRİN" in nu:
        prompt += (" This cart has BRASS/GOLD hardware: keep the poles, the spoked wheel RIM, "
                   "the brackets and the handle GOLD/BRASS — never silver, white or green.")
    if "KROM" in nu:
        prompt += (" Keep the chrome/steel SILVER metal parts silver — never green.")
    prompt += (" Also make sure the flat COUNTER TOP surface is the SAME color as the body "
               "(not black and not a different color), and keep white wheel spokes white.")
    final_dir = os.path.join(out_root, color, set_name)
    os.makedirs(final_dir, exist_ok=True)
    tmp_gen = tempfile.mkdtemp(prefix="gen_")     # gemini ham cikti
    tmp_frame = tempfile.mkdtemp(prefix="frame_") # kanonik cerceve

    imgs = sorted(glob.glob(os.path.join(set_dir, "*.png")) +
                  glob.glob(os.path.join(set_dir, "*.webp")) +
                  glob.glob(os.path.join(set_dir, "*.jpg")))
    if not imgs:
        sys.exit(f"gorsel yok: {set_dir}")

    env = dict(os.environ, GEMINI_API_KEY=load_key())
    print(f"[{set_name}] {color} -> {len(imgs)} gorsel")
    ok = 0
    for i, src in enumerate(imgs, 1):
        gen = os.path.join(tmp_gen, f"{i:02d}.png")
        # 1) Gemini recolor
        r = subprocess.run(["node", os.path.join(HERE, "recolor.mjs"), src, gen, prompt],
                           env=env, capture_output=True, text=True)
        if r.returncode != 0:
            print(f"  {i}/{len(imgs)} HATA: {r.stderr.strip()[:200]}")
            continue
        # 2) kanonik cerceve OPSIYONEL (varsayilan KAPALI; begenilen ilk set reframe'siz).
        #    Acmak icin: env RECOLOR_REFRAME=1
        frame = os.path.join(tmp_frame, f"{i:02d}.png")
        if os.environ.get("RECOLOR_REFRAME") == "1":
            subprocess.run(["python", os.path.join(HERE, "reframe.py"), src, gen, frame], check=True)
        else:
            shutil.copyfile(gen, frame)
        ok += 1
        print(f"  {i}/{len(imgs)} ok")

    # 3) ton normalize (sabit hedef) -> final
    subprocess.run(["python", os.path.join(HERE, "normalize.py"),
                    tmp_frame, final_dir, str(entry["hue"]), str(entry["sat"]),
                    str(entry.get("band", 38))], check=True)
    # 4) set-ici parlaklik esitleme (Gemini'nin parlak/koyu kare sapmasini keser).
    #    palette'te "v" varsa sabit hedefe, yoksa set medyanina.
    eq_cmd = ["python", os.path.join(HERE, "brightness_equalize.py"), final_dir]
    if "v" in entry:
        eq_cmd.append(str(entry["v"]))
    subprocess.run(eq_cmd, check=True)
    shutil.rmtree(tmp_gen, ignore_errors=True)
    shutil.rmtree(tmp_frame, ignore_errors=True)
    print(f"BITTI: {ok}/{len(imgs)} -> {final_dir}")

if __name__ == "__main__":
    main()
