# RUMICARTS Renk Değiştirme Aracı

Siyah taban ürün render setlerini yeni renk varyantlarına çevirir: **sadece gövde +
tente rengi** değişir; yazı, altın/krom direk, tekerlek, zemin, açı ve çerçeve **birebir
orijinal** kalır.

## ANA YÖNTEM: Deterministik (`recolor_set.py`)

Gemini KULLANMAZ. Siyah render'da sadece **koyu-nötr** (mat gövde/tente = siyah boya)
pikselleri hedef renge boyar, parlaklığı/gölgeyi koruyarak. Yazı **parlak** olduğu için
maskeye girmez → korunur. Çıktı orijinal görselin üstüne yazılır → **açı/çerçeve birebir**,
hiçbir kayma yok. Ton bir formülle sabit → **tüm görsellerde ve tüm ürünlerde birebir
aynı renk** (tutarlılık garanti).

Maske akışı: (1) koyu-nötr taban maske; (2) **bağlantılı bileşen** analizi — sadece büyük
bileşenler (gövde+tente) tutulur, böylece **caster tekerlekleri ve zemin temas gölgesi**
(gövdeyle aynı koyulukta ama küçük/ayrı) elenir, orijinal kalır; (3) bileşen içi derin
gölge doldurulur → iç raf beneği olmaz. Not: caster lastiği V≈0.15 ile gövdeyle aynı
parlaklıkta olduğu için renkle ayrılamaz, sadece bu bileşen analiziyle ayrılıyor.

```bash
python recolor_set.py "<siyah_set_klasoru>" yesil
# ornek:
python recolor_set.py ".../RUMICARTSORNEKGORSELLER/100CMSIYAHMATPIRINCRAFLI" yesil
```
Çıktı: `tools/recolor/cikti/<renk>/<set_adi>/01.png ...`

**Avantaj:** bedava, anında, API hatası yok, yazı birebir keskin, ton %100 tutarlı.
**Kaynak:** siyah tabanlı setler (koyu gövde şart). Beyaz setler bu yöntemle
renklenmez (gövde parlak).

## Renk paleti (`palette.json`)

Her renk: `hue` (ton açısı) + `sat` (doygunluk) — deterministik hedef. `prompt` alanı
sadece Gemini yedeği içindir. Yeni renk: bir sette dene, tonu beğenince `hue`/`sat`
kilitle, `durum` = `onayli`.

## Strateji: renk-öncelikli

Önce bir renk tüm siyah setlere, sonra sonraki renk. Ton palette'te sabit olduğu için o
renk her üründe birebir aynı; QA tek seferde.

## Yedek: Gemini (`pipeline.py` + `recolor.mjs` + `reframe.py` + `normalize.py`)

Deterministik yöntemin yetmediği durumlar için (örn. renklendirilecek koyu taban yoksa)
Gemini üretken recolor + kanonik reframe + ton normalize zinciri. Daha yavaş, API'ye
bağlı, minik yazıda bozulma olabilir. Detay dosya başlıklarında.

## Bilinen ufak nokta

Gövdeye bitişik temas gölgesi bazı açılarda çok küçük bir yeşil iz bırakabilir (bileşen
gövdeye bağlı olduğu için tam elenmez). Çok minik; gerekirse MIN eşiği / SC ayarlanır.
