# Rumicarts — Otomatik Render (SketchUp + V-Ray Ruby Script)

Bu doküman, `RENDER_BRIEF.md`'deki 456 render'ı (Faz 1: 24 + Faz 3: 432) **elle tek tek
tıklamadan**, bir Ruby script ile otomatik almak içindir. Script tüm renk/açı/parça
kombinasyonlarını gezer, her birinde kamerayı + parça görünürlüğünü + materyali ayarlar,
render alır ve doğru dosya adıyla kaydeder.

Script: `render_batch.rb` (aynı klasörde).

---

## ⚠️ Önce modeli bu sözleşmeye göre hazırla (3D'ci işi, tek seferlik)

Script doğru parçayı bulup değiştirebilmek için modeldeki isimlerin **birebir** aşağıdaki
gibi olması şart. Bir harf/büyük-küçük farkı script'i durdurur.

### 1) İki ayrı dosya (boyut başına)

100 ve 150 cm geometrisi farklı olduğu için iki ayrı `.skp`:

- `rumicarts_100.skp`
- `rumicarts_150.skp`

Her ikisi de aşağıdaki tag + materyal yapısına sahip olmalı. Script'i her dosya için
bir kez çalıştırırsın (script başında `BOYUT = "100"` / `"150"` ayarı var).

### 2) Tag'ler (parça izolasyonu için) — brief ile aynı

Her parça kendi tag'inde olmalı; script bir katmanı render ederken diğerlerini gizler.

| Tag adı      | Parça                         |
|--------------|-------------------------------|
| `Govde`      | Gövde                         |
| `Metal`      | Metal aksam (ayak, profil)    |
| `Tente`      | Kumaş tente                   |
| `Tekerlek`   | Dekoratif tekerlek            |
| `Raf`        | Raf varyantı                  |
| `Tutamac`    | Tutamaç varyantı              |
| `ArkaKapak`  | Arka kapak                    |

> Raf ve Tutamaç **ayrı tag** — ikisi de modelde bulunur, script doğru olanı gösterir.

### 3) Materyaller (renk değişimi için)

Renk değişen parçalar için **isimli materyaller**. Script bunların diffuse rengini
koddaki hex değerlerine ayarlar (site swatch'larıyla birebir aynı renk olsun diye).

| Materyal adı  | Açıklama                                              |
|---------------|-------------------------------------------------------|
| `Govde_mat`   | Gövde — **mat laminat** finish (yansıma/parlaklık ayarı 3D'ci tarafından) |
| `Govde_lake`  | Gövde — **parlak lake** finish                         |
| `Tente_mat`   | Tente kumaşı (mat dokulu)                              |

> Gövde materyali, ürünün finish'ine göre seçilir: `100-mat`/`150-mat` → `Govde_mat`,
> `*-lake` → `Govde_lake`. Script her ürün için doğru olanı kullanır; rengini de ayarlar.

Metal renkleri sadece renk değil yansıma da değiştirdiği için **4 hazır materyal**
(3D'ci doğru V-Ray reflectivity ile kurar):

| Materyal adı   | Metal varyantı |
|----------------|----------------|
| `Metal_krom`   | Krom           |
| `Metal_pirinc` | Pirinç         |
| `Metal_siyah`  | Siyah          |
| `Metal_beyaz`  | Beyaz          |

### 4) 6 kamera = 6 Scene (Sahne)

Brief'teki 6 açıyı bir kez kur, **tam bu adlarla** Scene olarak kaydet:

`on`, `on-sag`, `on-sol`, `arka`, `arka-sag`, `arka-sol`

Script kamerayı bu Scene'lerden okur. Açılar fazlar boyunca **asla** değişmemeli
(katmanlar üst üste bineceği için piksel piksel hizalı olmalı).

---

## V-Ray çıktı ayarları (bir kez, Asset Editor'den)

- Arka plan: **şeffaf** (Alpha) — PNG
- Çözünürlük: **2000 × 2000** kare
- Format: **PNG**, sRGB
- Işık + exposure: sabit (tüm render'larda aynı)
- Gölge: zemin gölgesini **yalnız gövde** katmanında bırak; diğer katmanlarda kapat
  (çift gölge olmasın). Script gövde dışı katmanlarda zemini gizler.

---

## Çalıştırma

1. SketchUp'ta doğru dosyayı aç (`rumicarts_100.skp` veya `rumicarts_150.skp`).
2. V-Ray yüklü ve çıktı ayarları yukarıdaki gibi olsun.
3. `Window > Ruby Console` aç.
4. `render_batch.rb` içeriğini yapıştır → `BOYUT` ve `OUT_DIR` değerlerini kontrol et →
   Enter.
5. Script kombinasyonları sırayla render eder; ilerlemeyi konsola yazar.

Çıktı dosyaları doğrudan `RENDER_BRIEF.md` isimlendirmesiyle gelir, örn:
`100-mat_on_hero.png`, `100-mat_on-sag_govde-mavi.png`, `150-lake_arka_metal-pirinc.png`.

---

## Render gelince siteye bağlama

PNG'ler hazır olunca `src/assets/configurator/` altına konur ve
`src/data/configurator.ts` içindeki `RENDER_REGISTRY`'ye import edilir. Dosya adları
zaten `renderKey()` formatında olduğu için eşleme otomatik. (Bu adımı Claude Code yapar.)

---

## ⚠️ Script'te teyit edilecek 2 nokta (V-Ray sürümüne bağlı)

`render_batch.rb` içindeki şu iki fonksiyon V-Ray sürümüne göre değişebilir; script
içinde `# TEYİT ET` ile işaretli:

1. `vray_set_output(path)` — render çıktısının kaydedileceği dosya yolu + 2000px ayarı.
2. `vray_render_and_wait` — render'ı başlat ve **bitene kadar bekle** (`UI.start_timer`
   ile `VRay::LiveScene.active.rendering?` yoklaması; bloklayan `sleep` ÇALIŞMAZ).

Kurulu V-Ray sürümün belli olunca bu ikisi netleştirilir; gerisi (kombinasyon mantığı,
isimlendirme, kamera, tag, materyal) hazır ve değişmez.
