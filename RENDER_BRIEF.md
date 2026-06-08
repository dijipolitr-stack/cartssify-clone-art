# Rumicarts Konfigüratör — Render Çekim Brief'i

Bu doküman, SketchUp + V-Ray ile render alacak kişiye yöneliktir. Kaynak model:
`260805_Rumicarts.skp` (SketchUp 2024, V-Ray sahnesi, içinde 100 cm ve 150 cm arabalar var).

Render'lar web konfigüratöründe kullanılacak. Amaç: ziyaretçi ürünü seçip
özelleştirdikçe doğru görseli göstermek + yüklediği logoyu yüzeylere bindirmek.

---

## 0) HER FAZDA GEÇERLİ GENEL KURALLAR

**6 sabit kamera açısı** — bir kez kur, Scene olarak kaydet, fazlar boyunca ASLA değiştirme.
Tüm katman/varyant render'ları birebir aynı kameradan alınmalı (üst üste bineceği için
piksel piksel hizalı olmalı):

| Kod        | Açı                       |
|------------|---------------------------|
| `on`       | Ön Görünüm                |
| `on-sag`   | Ön Sağ Çapraz Görünüm     |
| `on-sol`   | Ön Sol Çapraz Görünüm     |
| `arka`     | Arka Görünüm              |
| `arka-sag` | Arka Sağ Çapraz Görünüm   |
| `arka-sol` | Arka Sol Çapraz Görünüm   |

**Teknik ayarlar (hepsinde aynı):**
- Arka plan: **ŞEFFAF (PNG alpha)**. Faz 1'de de şeffaf tercih edilir.
- Tuval: **kare, 2000 × 2000 px** (tüm açılar aynı tuvalde, ürün ortalı). Min 1600 px.
- Format: **PNG**, sRGB.
- Işık + pozlama (exposure) tüm render'larda **birebir aynı** kalmalı.
- Zemin/gölge: yere düşen gölgeyi sadece taban (gövde) render'ında bırak; üst katmanlarda
  (tente, tekerlek, kapak vb.) zemin gölgesi OLMASIN ki çift gölge oluşmasın.

**4 ürün kodu** (boyut × yüzey):

| Kod        | Ürün                  |
|------------|-----------------------|
| `100-mat`  | 100 cm — Mat Lam      |
| `150-mat`  | 150 cm — Mat Lam      |
| `100-lake` | 100 cm — Parlak Lake  |
| `150-lake` | 150 cm — Parlak Lake  |

> Not: 100/150 geometri farklı; Mat Lam ↔ Parlak Lake aynı geometri, sadece yüzey
> (mat laminat ↔ parlak lake) farkı. Yani her boyutu bir kez kurup yüzey materyalini
> değiştirerek iki ürünü de alırsın.

**Dosya isimlendirme şablonu:**
```
{urun}_{aci}_{varyant}.png
```
Örnek: `100-mat_on-sag_govde-beyaz.png`

**Renk kodları (isimlendirmede):**
`beyaz, siyah, yesil, mavi, kirmizi` (gövde/tente) · `krom, pirinc, siyah, beyaz` (metal)

> "Özel" renkler render GEREKTİRMEZ — sitede serbest metinle alınacak, görsel değişmez.

---

## FAZ 1 — Katalog + temel set (ZORUNLU, en hızlı)  →  **24 render**

**Amaç:** 4 ürünü kataloğa koymak, site + konfigüratörü çalışır hale getirmek.

**Konfigürasyon (tam donanımlı showcase):**
Beyaz gövde · Beyaz tente (tenteli) · Krom metal · dekoratif tekerlekli · raflı · arka kapaklı.

**Adet:** 4 ürün × 6 açı = **24 render**

**İsim:** `{urun}_{aci}_hero.png`
Örnek: `100-mat_on_hero.png`, `150-lake_arka-sol_hero.png` … (24 dosya)

**Üretim:** Tek parça (composite) render yeterli — modeli parçalamana GEREK YOK.
Sadece 6 kamerayı kur, 4 ürünü sırayla render et.

> Bu faz tamamlanınca site canlıya hazır: katalog kartları, ürün sayfası görselleri,
> konfigüratör varsayılan önizleme ve logo overlay çalışır.

---

## FAZ 2 — Gövde rengi varyasyonları (yüksek değer)  →  **96 render**

**Amaç:** Konfigüratörde 5 gövde renginin de gerçek görünmesi.

Faz 1'deki tam donanımlı sahnenin AYNISI; sadece **gövde rengini** değiştir:
Siyah, Yeşil, Mavi, Kırmızı (Beyaz zaten Faz 1'de `hero` olarak var).
Tente Beyaz, Metal Krom sabit kalır.

**Adet:** 4 ürün × 4 renk × 6 açı = **96 render**

**İsim:** `{urun}_{aci}_govde-{renk}.png`
Örnek: `100-mat_on_govde-siyah.png`

**Üretim:** Yine composite, parçalama gerekmez — sadece gövde materyalini değiştir.

> Sınır: Bu fazda tente rengi / metal rengi / tekerlek-raf-kapak görselde sabittir
> (sadece gövde rengi değişir). Her opsiyonun bağımsız değişmesi için Faz 3 gerekir.

---

## FAZ 3 — Tam opsiyon bağımsızlığı (KATMANLI / overlay)  →  **432 render**

**Amaç:** Her opsiyonun (tente var/yok + rengi, metal rengi, tekerlek, raf↔tutamaç,
arka kapak) önizlemede bağımsız değişebilmesi. Böylece 1600 kombinasyonun tamamı
sadece ~432 katman render'ı ile, tarayıcıda üst üste bindirilerek elde edilir.

> **Faz 3'ü yaparsan Faz 2'yi atlayabilirsin** — gövde rengi zaten 3a katmanında geliyor.
> Faz 1 (24 hero) yine katalog için kullanılır.

**ÖN KOŞUL — model hazırlığı:** Modeldeki parçaları ayrı **Tag (Layer)**'lara ayır:
`Govde`, `Metal`, `Tente`, `Tekerlek`, `Raf`, `Tutamac`, `ArkaKapak`.
Her katman render edilirken DİĞER tüm parçalar gizlenir, aynı kameradan, şeffaf zeminde alınır.

**Katman grupları (her ürün × her açı):**

| Grup | Katman                    | Varyant                                  | Render/ürün/açı |
|------|---------------------------|------------------------------------------|-----------------|
| 3a   | Gövde (yalnız gövde)      | beyaz, siyah, yesil, mavi, kirmizi       | 5               |
| 3b   | Metal (yalnız metal)      | krom, pirinc, siyah, beyaz               | 4               |
| 3c   | Tente (yalnız kumaş)      | beyaz, siyah, yesil, mavi, kirmizi       | 5               |
| 3d   | Dekoratif tekerlek        | (tek)                                    | 1               |
| 3e   | Raf + Tutamaç             | raf, tutamac                             | 2               |
| 3f   | Arka kapak                | (tek)                                    | 1               |
|      |                           | **Toplam / ürün / açı**                  | **18**          |

**Adet:** 18 katman × 6 açı × 4 ürün = **432 render**

**İsim:** `{urun}_{aci}_{grup}-{varyant}.png`
Örnekler:
```
100-mat_on_govde-mavi.png
100-mat_on_metal-pirinc.png
100-mat_on_tente-kirmizi.png
100-mat_on_tekerlek.png
100-mat_on_raf.png
100-mat_on_tutamac.png
100-mat_on_arkakapak.png
```

**Üretim notları:**
- Her katmanı izole render et (sadece o tag görünür). Üst katmanlar gövdenin üstüne
  bineceği için gövde tüm yüzeyi görünür şekilde render edilir — bu doğrudur.
- Kamera + ışık + tuval Faz 1 ile birebir aynı kalmalı.
- "Yok" seçenekleri (tente yok, tekerlek yok, arka kapak yok) render gerektirmez —
  o katman sitede gösterilmez.

---

## ÖZET

| Faz   | Açıklama                          | Render adedi | Durum                     |
|-------|-----------------------------------|--------------|---------------------------|
| Faz 1 | Katalog + temel (tam donanımlı)   | **24**       | Zorunlu, hemen            |
| Faz 2 | Gövde rengi varyasyonları         | **96**       | Faz 3 yapılırsa atlanabilir |
| Faz 3 | Tam katmanlı opsiyon bağımsızlığı | **432**      | Tam fidelity, ön koşul: tag ayrımı |

**Önerilen rotalar:**
- **Minimum (canlıya çık):** Faz 1 → 24 render
- **İyi (gövde rengi çalışır):** Faz 1 + Faz 2 → 120 render
- **Tam (her opsiyon görselde):** Faz 1 + Faz 3 → 456 render (Faz 2 atlanır)

İlk teslimat olarak **Faz 1'in 24 render'ını** isteyin; site ve konfigüratör iskeleti
bununla ayağa kalkar, gerisini paralelde tamamlarsınız.
