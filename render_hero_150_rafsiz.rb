# =============================================================================
# Rumicarts — HERO Render — 150 cm RAFSIZ KOPYASI (SketchUp 2026 + V-Ray 7)
#
# ⚠️ BU, render_hero_150.rb'NİN AYRI KOPYASIDIR. Ne orijinal (100 rafsız) ne de
# 150 raflı pipeline'a DOKUNMAZ: ayrı modül (Rumicarts150Rafsiz), ayrı çıktı klasörü
# (renders150_rafsiz). 150 RAFSIZ aracın render setini almak için yazıldı (2026-06-21).
#
# Sahnede 3 araç var (150 raflı / 150 rafsız / 100 raflı). Mevcut 7 sahne kamerası
# ESKİ araca (100 rafsız) bakıyor. Bu kopya, kameraları 150 RAFSIZ aracın merkezine
# YENİDEN NİŞANLAR (aim_at_selection) — geometriyi taşımadan, açı/uzaklık/fov koruyarak.
#
# KULLANIM (Ruby Console, bu dosyayı load et):
#   1) 150 RAFSIZ aracı (tek grup/component) TIKLA → Rumicarts150Rafsiz::Hero.aim_at_selection
#   2) Diğer 2 aracı (150 raflı + 100 raflı) seç → H (Hide) ile gizle. Geri: Edit > Unhide All.
#   3) V-Ray Render bas → 150 RAFSIZ görününce Stop (ISIT).
#   4) Doğrula: Rumicarts150Rafsiz::Hero.run(test: true) → render_hero_test.bat → ON karesine bak.
#   5) Doğruysa: Rumicarts150Rafsiz::Hero.run  (+ run_colors / run_variant aynı offset'le)
#   Çıktılar: C:/Users/kuruyemis/Desktop/renders150_rafsiz
# =============================================================================

module Rumicarts150Rafsiz
  module Hero
    # ---- AYARLAR ------------------------------------------------------------
    OUT_DIR = "C:/Users/kuruyemis/Desktop/renders150_rafsiz"   # AYRI klasör (eskiyi ezmez), otomatik oluşur
    ENGINE  = :cpu      # :cpu (DOĞRULANDI çalışıyor) | :gpu (CUDA — NVIDIA sürücü >= 525.60 ŞART, yoksa siyah render)
    RES_W   = 2000      # hero için genişlik
    RES_H   = 2000      # kare istemiyorsan değiştir (örn. 2000x1500)
    EXPORT_VRSCENE = true   # ÖNERİLEN: vrscene export → vray.exe ile gözetimsiz toplu render

    # Modeldeki GERÇEK sahne adları (scene_thumbnails'ten doğrulandı) → dosya soneki
    SCENES = {
      "ON"        => "on",
      "ONSAG"     => "on-sag",
      "ONSOL"     => "on-sol",
      "ARKA"      => "arka",
      "ARKASAG"   => "arka-sag",
      "ARKASOL"   => "arka-sol",
      "ARKAKAPAK" => "arka-kapak",
    }

    # ---- HEDEFLİ RENK ÇEKİMİ (gövde varyantları) ----------------------------
    # Gövde materyali keşfedildi: "Color M00" (beyaz düz renk, doku yok).
    # configurator.ts'teki gövde renk hex'leriyle birebir (özel hariç).
    BODY_MATERIAL = "Color M00"
    BODY_COLORS = {
      "beyaz"   => [243, 241, 236],   # #f3f1ec (render'da zaten var = referans)
      "siyah"   => [31, 31, 31],      # #1f1f1f
      "yesil"   => [93, 106, 58],     # #5d6a3a
      "mavi"    => [52, 86, 127],     # #34567f
      "kirmizi" => [176, 58, 46],     # #b03a2e
    }
    # Render alınacak varyantlar (beyaz zaten elde var → tekrar render gerekmez)
    COLOR_VARIANTS = %w[siyah yesil mavi kirmizi]

    def self.model; Sketchup.active_model; end
    def self.renderer; VRay::Context.active.renderer; end

    # ---- 1 DAKİKALIK METHOD KEŞFİ (dökümandan değil, canlı öğren) -----------
    def self.discover
      puts "== Model sahneleri (Pages) =="
      model.pages.each { |p| puts "  #{p.name.inspect}" }

      unless defined?(VRay) && VRay::Context.active
        puts "VRay::Context tanımsız — V-Ray yüklü değil/aktif değil."
        return
      end

      ctx = VRay::Context.active
      puts "== VRay constants =="
      puts VRay.constants.sort.inspect

      puts "== VRay::Context.active.methods(false) (TÜMÜ) =="
      puts ctx.methods(false).sort.inspect

      puts "== ctx grep (render|export|vrscene|image|render|save|size|res|out) =="
      puts ctx.methods.grep(/render|export|vrscene|image|save|size|res|out|file|scene/i).sort.inspect

      rnd = (ctx.respond_to?(:renderer) ? ctx.renderer : nil)
      if rnd
        puts "== renderer class =="
        puts rnd.class.to_s
        puts "== renderer.methods(false) (TÜMÜ) =="
        puts rnd.methods(false).sort.inspect
        puts "== renderer grep (render|export|vrscene|image|save|size|res|out|file|stop|start) =="
        puts rnd.methods.grep(/render|export|vrscene|image|save|size|res|out|file|stop|start/i).sort.inspect
      else
        puts "ctx.renderer alınamadı."
      end
    end

    # ---- Kamera teşhisi: sahnelerin GERÇEKTEN farklı açıları var mı? --------
    # Render almadan önce çalıştır. Her sahnenin kamera konumunu (eye) yazar.
    # eye değerleri birbirinden farklıysa → açılar farklı (script düzeltmesi yeter).
    # Hepsi ~aynıysa → 3D'ci sahnelere ayrı kamera koymamış (modelde düzeltilmeli).
    def self.check_cameras
      SCENES.each_key do |scene|
        page = model.pages[scene]
        unless page
          puts "  #{scene}: SAHNE YOK"
          next
        end
        c = page.camera
        eye = c.eye
        puts format("  %-10s eye=(%.0f, %.0f, %.0f)  fov=%.1f", scene, eye.x, eye.y, eye.z, (c.perspective? ? c.fov : -1))
      end
    end

    # ---- 150 RAFSIZ'A NİŞAN ALMA (iki-araç offset'i) -----------------------
    # 7 sahne kamerası ESKİ araca (100 rafsız) GÜZEL kadrajla bakıyor (araç kareyi dolduruyor).
    # 150 RAFSIZ'ı AYNI kadrajla çekmek için kamerayı, iki aracın MERKEZ farkı kadar kaydırırız:
    # offset = merkez(150 rafsız) - merkez(100 rafsız). Yön/uzaklık/fov AYNEN korunur; 150 rafsız,
    # eski aracın durduğu yerde aynı boyutta görünür. (Önceki cam.target yöntemi YANLIŞTI:
    # bu sahnelerde target araçta değil uzakta → kamera çok geri düşüp aracı küçülttü.)
    #
    # KULLANIM (sırayla):
    #   0) Edit > Unhide All (tüm araçlar görünsün ki ikisini de seçebil).
    #   1) ESKİ 100 RAFSIZ aracı (ilk render'ın aracı) TIKLA → Rumicarts150Rafsiz::Hero.mark_source
    #   2) 150 RAFSIZ aracı TIKLA → Rumicarts150Rafsiz::Hero.aim_at_selection
    #   3) 150 rafsız HARİÇ diğer araçları seç → H (Hide). Geri: Edit > Unhide All.
    #   4) V-Ray ısıt (Render → Stop) → Hero.run(test: true) → render_hero_test.bat → PNG.
    # Sıfırla: Rumicarts150Rafsiz::Hero.aim_reset
    @src_center = nil   # eski araç (100 rafsız) bbox merkezi
    @offset     = nil   # [dx, dy, dz] inç — export'ta her kameranın eye'ına eklenir

    def self.bbox_center_of_selection
      sel = model.selection
      raise "Secim bos — ilgili araci (grup/component) tikla, sonra tekrar calistir." if sel.empty?
      bb = Geom::BoundingBox.new
      sel.each { |e| bb.add(e.bounds) if e.respond_to?(:bounds) }
      bb.center
    end

    def self.mark_source
      @src_center = bbox_center_of_selection
      puts format("[Nisan] KAYNAK (eski/100 rafsiz) merkez = (%.0f, %.0f, %.0f)", @src_center.x, @src_center.y, @src_center.z)
      puts "[Nisan] SIMDI: 150 RAFSIZ araci sec → Rumicarts150Rafsiz::Hero.aim_at_selection"
    end

    def self.aim_at_selection
      raise "Once kaynagi isaretle: ESKI 100 rafsiz araci sec → Hero.mark_source" unless @src_center
      c = bbox_center_of_selection
      @offset = [c.x - @src_center.x, c.y - @src_center.y, c.z - @src_center.z]
      puts format("[Nisan] HEDEF (150 rafsiz) merkez = (%.0f, %.0f, %.0f)", c.x, c.y, c.z)
      puts format("[Nisan] OFFSET = (%.0f, %.0f, %.0f) inc — 150 rafsiz, eski aracin kadrajinda gorunecek.", *@offset)
      puts "[Nisan] SIMDI: 150 rafsiz HARIC diger araclari gizle (H) → V-Ray isit → Hero.run(test: true)."
    end

    def self.aim_reset
      @src_center = nil; @offset = nil
      puts "[Nisan] Sifirlandi — kameralar eski araca (offset yok) dondu."
    end

    # ---- Gövde materyali keşfi (HEDEFLİ RENK ÇEKİMİ için) -------------------
    # AMAÇ: gövde panelini hangi materyalin boyadığını bulmak. Renk varyantı
    # render'ları için (siyah/yeşil/mavi/kırmızı) o materyalin diffuse rengini
    # döngüyle değiştireceğiz. KULLANIM: SketchUp'ta gövde panelini (büyük beyaz
    # kutu yüzeyi) TIKLA → Ruby Console'da: Rumicarts150Rafsiz::Hero.body_material
    def self.body_material
      sel = model.selection
      puts "== SEÇİLİ ÖĞELERİN MATERYALİ (gövde panelini seçtiysen burada görünür) =="
      if sel.empty?
        puts "  (seçim boş — gövde yüzeyine tıkla, sonra tekrar çalıştır)"
      end
      sel.each do |e|
        nm = e.respond_to?(:material) && e.material ? e.material.display_name : "nil"
        extra = ""
        if e.is_a?(Sketchup::Face)
          bm = e.back_material ? e.back_material.display_name : "nil"
          extra = "  back=#{bm}"
        end
        puts "  #{e.class.name.split('::').last}: front=#{nm}#{extra}"
      end
      puts "== MODELDEKİ TÜM MATERYALLER (ad + SketchUp diffuse rengi) =="
      model.materials.each do |m|
        c = (m.color.to_a rescue "?")
        tex = (m.texture ? "TEXTURE(#{File.basename(m.texture.filename.to_s)})" : "düz renk")
        puts "  #{m.display_name.inspect}  rgb=#{c}  #{tex}"
      end
      puts "TOPLAM #{model.materials.size} materyal."
      puts "→ Gövde materyalinin adını Claude'a söyle; renk varyantı script'i ona göre yazılacak."
    end

    # ---- Gövde rengini ayarla (TEST + run_colors içinde kullanılır) ---------
    # KULLANIM (yansıma testi): Rumicarts150Rafsiz::Hero.set_body_color("kirmizi")
    # → sonra V-Ray Render'a bas. Gövde kırmızı çıkarsa SketchUp rengi V-Ray'e
    # yansıyor demektir → run_colors çalışır. Beyaz kalırsa V-Ray Asset Editor
    # materyali override ediyordur → renk V-Ray API'siyle değiştirilmeli (Claude'a söyle).
    # Gövde materyalini esnek bul: "Color M00" ve "[Color M00]" ikisini de yakalar
    # (crash sonrası açılan modellerde ad köşeli parantezli gelebiliyor).
    def self.body_material
      bare = BODY_MATERIAL.gsub(/[\[\]]/, "")
      model.materials[BODY_MATERIAL] ||
        model.materials["[#{bare}]"] ||
        model.materials[bare] ||
        model.materials.find { |mt| mt.name.gsub(/[\[\]]/, "") == bare }
    end

    def self.set_body_color(name)
      rgb = BODY_COLORS[name] or raise "Bilinmeyen renk: #{name.inspect}. Geçerli: #{BODY_COLORS.keys.inspect}"
      m = body_material or raise "Materyal yok: #{BODY_MATERIAL.inspect}. Modelde: #{model.materials.map(&:name).inspect}"
      m.color = Sketchup::Color.new(*rgb)
      model.active_view.refresh rescue nil
      puts "Gövde ('#{BODY_MATERIAL}') → '#{name}' #{rgb} yapıldı."
      puts "V-Ray Render'a bas; gövde bu renk mi kontrol et. Beyaza dön: Hero.set_body_color('beyaz')"
    end

    # ---- 4 RENK × 6 AÇI = 24 varyant render (deterministik kamera) ----------
    # ÖN KOŞUL: sahne ısınmış olmalı (önce V-Ray Render bas → araba görününce Stop;
    # bkz. run'daki soğuk-export notu). set_body_color yansıma testi GEÇMİŞ olmalı.
    # Her renk için: materyali boya → base vrscene export (geometri+renk) → 6 sahnenin
    # kamerasını metinde yaz. Sonra renders\render_colors.bat üretir.
    def self.run_colors
      require "fileutils"; FileUtils.mkdir_p(OUT_DIR)
      puts "[Renk] #{COLOR_VARIANTS.size} renk × #{SCENES.size} açı = #{COLOR_VARIANTS.size * SCENES.size} render."
      set_camera(SCENES.keys.first)  # geometri için kamera kur (kamerası önemsiz)
      exported = []
      COLOR_VARIANTS.each do |cname|
        set_body_color(cname)
        base_path = File.join(OUT_DIR, "_base_#{cname}.vrscene")
        renderer.export(base_path)
        kb = (File.size(base_path) / 1024.0).round
        if kb < 200
          puts "  ⚠ #{cname} base #{kb} KB → SOĞUK EXPORT (geometri yok). Sahneyi ısıt (Render→Stop), tekrar dene."
          set_body_color("beyaz"); return
        end
        base = File.read(base_path)
        unless base =~ RENDERVIEW_RE
          puts "  ⚠ RenderView bulunamadı — dur."; set_body_color("beyaz"); return
        end
        SCENES.each do |scene, suffix|
          next if scene == "ARKAKAPAK"  # konfigüratörde arka-kapak açısı yok (AngleId 6 açı)
          tline = cam_transform_line(scene)
          out = base.sub(RENDERVIEW_RE) { "#{$1}#{tline}\n" }
          name = "rumicarts_hero_#{cname}_#{suffix}"
          File.write(File.join(OUT_DIR, "#{name}.vrscene"), out)
          exported << name
        end
        File.delete(base_path) rescue nil
        puts "  ✓ #{cname}: #{SCENES.size - 1} açı vrscene yazıldı (#{kb} KB base)."
      end
      set_body_color("beyaz")  # modeli orijinal beyaza döndür
      # .bat üret
      eng = (ENGINE == :gpu ? "-rtEngine=5 -rtNoise=0.01" : "")
      lines = ["@echo off", "setlocal"]
      exported.each do |b|
        vs  = File.join(OUT_DIR, "#{b}.vrscene").tr("/", "\\")
        png = File.join(OUT_DIR, "#{b}.png").tr("/", "\\")
        lines << %Q{echo Rendering #{b} ...}
        lines << %Q{"#{VRAY_EXE}" -sceneFile="#{vs}" -imgFile="#{png}" -imgWidth=#{RES_W} -imgHeight=#{RES_H} -display=0 #{eng}}
      end
      lines << "echo BITTI. #{exported.size} renk-varyant render."
      bat = File.join(OUT_DIR, "render_colors.bat")
      File.write(bat, lines.join("\r\n"))
      puts "[Renk] ✓ #{exported.size} vrscene yazıldı. .bat: #{bat}"
      puts "[Renk] render_colors.bat çift tıkla → #{exported.size} PNG (gözetimsiz)."
    end

    # ---- TEKERLEK-YOK render seti (DekorTekerlek tag'i gizli) ---------------
    # ÖN KOŞUL (SketchUp'ta bir kez): dekoratif tekerlek + çamurluk bir "DekorTekerlek"
    # tag'ine atanmış olmalı. Tag göz ikonu kapanınca SADECE tekerlek+çamurluk kaybolmalı.
    #
    # Tekerlek M00 (gövde rengi) materyaliyle boyandığı için renk başına ayrı render
    # gerekir → 5 renk × 6 açı = 30 kare (run_colors'ın tekerlek-yok ikizi).
    #
    # KULLANIM:
    #   1) Hero.teker_off            → tag'i gizler (ekranda tekerlek kaybolur)
    #   2) V-Ray Render bas → tekerleksiz araba görününce Stop  (sahneyi ISIT)
    #   3) Hero.run_tekeryok(test: true)  → TEK kare (beyaz, ON) vrscene + test .bat
    #      render_tekeryok_test.bat çift tıkla → 1 PNG → Claude'a gönder (temiz mi?)
    #   4) Temizse: Hero.run_tekeryok      → 30 kare vrscene + render_tekeryok.bat
    #   5) Bitince Hero.teker_on    → tekerleği geri getir (modeli bozma)
    TEKER_TAG = "DekorTekerlek"

    def self.tag(name)
      (model.layers[name] rescue nil) || (model.tags[name] rescue nil)
    end

    def self.set_tag_visible(name, vis)
      lyr = tag(name) or raise "Tag yok: '#{name}'. SketchUp'ta tekerlek+çamurluğu bu tag'e ata."
      lyr.visible = vis
      model.active_view.refresh rescue nil
    end

    def self.teker_off
      set_tag_visible(TEKER_TAG, false)
      puts "[TekerYok] '#{TEKER_TAG}' gizlendi — ekranda tekerlek+çamurluk kayboldu mu bak."
      puts "[TekerYok] ŞİMDİ: V-Ray Render bas → tekerleksiz araba görününce Stop (ISIT) → Hero.run_tekeryok(test: true)"
    end

    def self.teker_on
      set_tag_visible(TEKER_TAG, true)
      set_body_color("beyaz") rescue nil
      puts "[TekerYok] '#{TEKER_TAG}' geri açıldı + gövde beyaza döndü. Model orijinal halinde."
    end

    # Tekerlek-yok BEYAZ base seti: tekerlek tag'i gizli + gövde beyaz iken her açı için
    # tek vrscene export et (kamera metinde değiştirilir). RENK BURADA ÜRETİLMEZ —
    # set_body_color V-Ray'e yansımadığı için (kanıtlanmış) renkler Python vrscene
    # diffuse-replace ile üretilir (renk render pipeline'ıyla aynı). Bu metod sadece
    # geometri+kamera'sı doğru 6 beyaz vrscene verir; Claude onları 5 renge çoğaltır.
    def self.run_tekeryok(test: false)
      require "fileutils"; FileUtils.mkdir_p(OUT_DIR)
      set_tag_visible(TEKER_TAG, false)        # tekerlek gizli
      set_body_color("beyaz") rescue nil       # base beyaz (renk Python tarafında)
      scenes = test ? { "ON" => "on" } : SCENES.reject { |s, _| s == "ARKAKAPAK" }
      puts "[TekerYok] #{scenes.size} açı BEYAZ base export#{test ? ' (TEST)' : ''}. Renkler sonra Python ile üretilir."
      set_camera(SCENES.keys.first)
      base_path = File.join(OUT_DIR, "_base_tekeryok.vrscene")
      renderer.export(base_path)
      kb = (File.size(base_path) / 1024.0).round
      if kb < 200
        puts "  ⚠ base #{kb} KB → SOĞUK EXPORT (geometri yok)."
        puts "    Tekerlek GİZLİYKEN sahneyi ısıt: V-Ray Render bas → tekerleksiz araba görününce Stop,"
        puts "    sonra Hero.run_tekeryok#{test ? '(test: true)' : ''} TEKRAR. (Tag gizli bırakıldı, teker_on YAPMA.)"
        return
      end
      base = File.read(base_path)
      unless base =~ RENDERVIEW_RE
        puts "  ⚠ RenderView bulunamadı — dur."; return
      end
      exported = []
      scenes.each do |scene, suffix|
        tline = cam_transform_line(scene)
        out   = base.sub(RENDERVIEW_RE) { "#{$1}#{tline}\n" }
        name  = "rumicarts_hero_#{suffix}_tekeryok"     # beyaz base (renksiz, açı başına 1)
        File.write(File.join(OUT_DIR, "#{name}.vrscene"), out)
        exported << name
      end
      File.delete(base_path) rescue nil
      # beyaz .bat (geometri/açı kontrolü için — test'te tek kare, tam sette 6 açı önizleme)
      eng = (ENGINE == :gpu ? "-rtEngine=5 -rtNoise=0.01" : "")
      lines = ["@echo off", "setlocal"]
      exported.each do |b|
        vs  = File.join(OUT_DIR, "#{b}.vrscene").tr("/", "\\")
        png = File.join(OUT_DIR, "#{b}.png").tr("/", "\\")
        lines << %Q{echo Rendering #{b} ...}
        lines << %Q{"#{VRAY_EXE}" -sceneFile="#{vs}" -imgFile="#{png}" -imgWidth=#{RES_W} -imgHeight=#{RES_H} -display=0 #{eng}}
      end
      lines << "echo BITTI. #{exported.size} beyaz tekerlek-yok render."
      bat = File.join(OUT_DIR, test ? "render_tekeryok_test.bat" : "render_tekeryok_beyaz.bat")
      File.write(bat, lines.join("\r\n"))
      puts "[TekerYok] ✓ #{exported.size} BEYAZ vrscene yazıldı (#{kb} KB base). .bat: #{bat}"
      if test
        puts "[TekerYok] TEST: render_tekeryok_test.bat çift tıkla → 1 PNG → Claude'a gönder."
      else
        puts "[TekerYok] ŞİMDİ: Claude'a haber ver → 6 vrscene'i Python ile 5 renge çoğaltıp"
        puts "[TekerYok] 30 kare render_tekeryok_renkli.bat hazırlayacak. (Tekerlek tag'i gizli BIRAK,"
        puts "[TekerYok]  render bitince Hero.teker_on ile geri getir.)"
      end
    end

    # ---- TENTE-YOK + KOMBİNASYON render seti (genel varyant) ----------------
    # ÖN KOŞUL (SketchUp'ta bir kez): kumaş tente + taşıyıcı direkler bir
    # "KumasTente" tag'ine atanmış olmalı (tekerlek için "DekorTekerlek" gibi).
    # Tag göz ikonu kapanınca SADECE tente+direkler kaybolmalı; kutu/tezgah kalmalı.
    #
    # Bu metod, run_tekeryok'un GENEL halidir: hangi tag'leri gizleyeceğini ve
    # dosya sonekini parametre alır. Gizlenmeyen varyant tag'leri otomatik GÖRÜNÜR
    # yapılır (temiz durum). Gövde beyaz base export edilir; renkler sonra Python
    # diffuse-replace ile (renk pipeline'ıyla aynı) 5 renge çoğaltılır.
    #
    # VARYANT TAG'LERİ — önizlemeyi etkileyen geometri eksenleri:
    VARIANT_TAGS = ["DekorTekerlek", "KumasTente"]
    #
    # KULLANIM (her komutu sırayla; her biri 6 beyaz base verir):
    #   A) Tente YOK (tekerlek VAR):
    #      1) Hero.set_variant_tags(hide: ["KumasTente"])   → tente gizli, tekerlek görünür
    #      2) V-Ray Render bas → araba tentesiz görününce Stop (sahneyi ISIT)
    #      3) Hero.run_variant(suffix: "-tenteyok", hide: ["KumasTente"], test: true) → 1 test
    #         render-tenteyok_test.bat çift tıkla → 1 PNG → Claude'a gönder (temiz mi?)
    #      4) Temizse: Hero.run_variant(suffix: "-tenteyok", hide: ["KumasTente"])
    #   B) Tente YOK + Tekerlek YOK:
    #      1) Hero.set_variant_tags(hide: ["KumasTente", "DekorTekerlek"]) → ikisi gizli
    #      2) V-Ray Render → Stop (ISIT)
    #      3) Hero.run_variant(suffix: "-tekeryok-tenteyok", hide: ["KumasTente", "DekorTekerlek"])
    #   C) Bitince: Hero.variant_reset → tüm tag'leri aç + gövde beyaza dön
    def self.set_variant_tags(hide:)
      VARIANT_TAGS.each { |t| set_tag_visible(t, !hide.include?(t)) }
      shown = VARIANT_TAGS - hide
      puts "[Varyant] gizli=#{hide.inspect} görünür=#{shown.inspect} — ekranda doğru mu bak."
      puts "[Varyant] ŞİMDİ: V-Ray Render bas → doğru araba görününce Stop (ISIT) → run_variant(... test: true)"
    end

    def self.variant_reset
      VARIANT_TAGS.each { |t| set_tag_visible(t, true) rescue nil }
      set_body_color("beyaz") rescue nil
      puts "[Varyant] Tüm varyant tag'leri açıldı + gövde beyaza döndü. Model orijinal halinde."
    end

    # Beyaz base seti: hide tag'leri gizli (gerisi görünür) iken her açı için tek
    # vrscene export. Renk BURADA üretilmez — set_body_color V-Ray'e yansımadığı
    # için (kanıtlanmış) renkler Python ile çoğaltılır. suffix dosya adına eklenir:
    # rumicarts_hero_{açı}{suffix} (örn. -tenteyok / -tekeryok-tenteyok).
    def self.run_variant(suffix:, hide:, test: false)
      require "fileutils"; FileUtils.mkdir_p(OUT_DIR)
      set_variant_tags(hide: hide)
      set_body_color("beyaz") rescue nil
      scenes = test ? { "ON" => "on" } : SCENES.reject { |s, _| s == "ARKAKAPAK" }
      puts "[Varyant#{suffix}] #{scenes.size} açı BEYAZ base export#{test ? ' (TEST)' : ''}. Renkler Python ile gelir."
      set_camera(SCENES.keys.first)
      # KRİTİK (2026-06-17): model.pages.selected_page = page, sahnenin KAYITLI tag/katman
      # görünürlüğünü geri yükleyebilir → gizlediğimiz tekerlek/tente sahneye geçince
      # TEKRAR GÖRÜNÜR olup export'a tekerlekli/tenteli sızar (yaşanan tekerlek bug'ı).
      # Export'tan hemen ÖNCE tag'leri tekrar gizle → sahne ne kaydederse etsin gizli kalır.
      hide.each { |t| set_tag_visible(t, false) }
      base_path = File.join(OUT_DIR, "_base_variant.vrscene")
      renderer.export(base_path)
      kb = (File.size(base_path) / 1024.0).round
      if kb < 200
        puts "  ⚠ base #{kb} KB → SOĞUK EXPORT (geometri yok)."
        puts "    Tag'ler doğru gizliyken sahneyi ISIT: V-Ray Render → Stop, sonra run_variant TEKRAR."
        puts "    (Tag durumunu BOZMA, variant_reset YAPMA.)"
        return
      end
      base = File.read(base_path)
      unless base =~ RENDERVIEW_RE
        puts "  ⚠ RenderView bulunamadı — dur."; return
      end
      exported = []
      scenes.each do |scene, asuffix|
        tline = cam_transform_line(scene)
        out   = base.sub(RENDERVIEW_RE) { "#{$1}#{tline}\n" }
        name  = "rumicarts_hero_#{asuffix}#{suffix}"   # beyaz base (açı başına 1)
        File.write(File.join(OUT_DIR, "#{name}.vrscene"), out)
        exported << name
      end
      File.delete(base_path) rescue nil
      eng = (ENGINE == :gpu ? "-rtEngine=5 -rtNoise=0.01" : "")
      lines = ["@echo off", "setlocal"]
      exported.each do |b|
        vs  = File.join(OUT_DIR, "#{b}.vrscene").tr("/", "\\")
        png = File.join(OUT_DIR, "#{b}.png").tr("/", "\\")
        lines << %Q{echo Rendering #{b} ...}
        lines << %Q{"#{VRAY_EXE}" -sceneFile="#{vs}" -imgFile="#{png}" -imgWidth=#{RES_W} -imgHeight=#{RES_H} -display=0 #{eng}}
      end
      lines << "echo BITTI. #{exported.size} beyaz varyant render."
      tag = suffix.gsub(/[^a-z0-9]+/i, "_").sub(/^_/, "")
      bat = File.join(OUT_DIR, test ? "render_#{tag}_test.bat" : "render_#{tag}_beyaz.bat")
      File.write(bat, lines.join("\r\n"))
      puts "[Varyant#{suffix}] ✓ #{exported.size} BEYAZ vrscene yazıldı (#{kb} KB base). .bat: #{bat}"
      if test
        puts "[Varyant#{suffix}] TEST: #{File.basename(bat)} çift tıkla → 1 PNG → Claude'a gönder."
      else
        puts "[Varyant#{suffix}] ŞİMDİ: Claude'a haber ver → 6 vrscene'i Python ile 5 renge çoğaltıp"
        puts "[Varyant#{suffix}] 30 kare render eder. (Tag durumunu BIRAK; tüm varyantlar bitince variant_reset.)"
      end
    end

    # ---- Kamera: sahneyi etkinleştir (ANİMASYONSUZ — kritik) ----------------
    # DİKKAT (2026-06-12 düzeltme): model.pages.selected_page = page kamerayı
    # ANİMASYONLA geçirir (tween). Döngüde hemen export edilince kamera daha
    # hedefe oturmadan yakalanır → 7 sahne de ~ön açıdan render edilir (BUG).
    # Çözüm: geçiş süresi 0 + kamerayı page.camera ile DOĞRUDAN ata (senkron, anında).
    def self.set_camera(scene_name)
      page = model.pages[scene_name]
      raise "Scene yok: '#{scene_name}'. Modeldeki adlar: #{model.pages.map(&:name).inspect}" unless page
      # 1) Sahne geçiş animasyonunu kapat (varsa) — selected_page anında uygulansın
      begin
        opts = model.options["PageOptions"]
        opts["ShowTransition"]   = false if opts.respond_to?(:[]) && opts["ShowTransition"]
        opts["TransitionTime"]   = 0.0   if opts.respond_to?(:[])
      rescue StandardError
      end
      # 2) KRİTİK (2026-06-17): model.pages.selected_page = page ARTIK YAPILMIYOR.
      # selected_page, sahnenin KAYITLI tag/gizli-geometri görünürlüğünü geri yüklüyor →
      # gizlediğimiz tekerlek/tente her render'da geri dönüp export'a sızıyordu (tekerlek bug'ı).
      # Sadece kamerayı doğrudan atıyoruz; mevcut (gizli) geometri durumu korunur.
      model.active_view.camera = page.camera if page.respond_to?(:camera) && page.camera
    end

    # ---- V-Ray render — DOĞRULANDI (discover + canlı test, 2026-06-11) -------
    def self.render_one(basename)
      if EXPORT_VRSCENE
        path = File.join(OUT_DIR, "#{basename}.vrscene")
        renderer.export(path)   # DOĞRULANDI: renderer.export(yol) → .vrscene yazar (nil döner, dosya oluşur)
        @exported << basename
        # Boyut kontrolü: geometri varsa MB'lar olur (~6MB). KB ise SOĞUK EXPORT
        # (sahne translate edilmemiş) → V-Ray'i bir kez render edip durdur, tekrar dene.
        kb = (File.size(path) / 1024.0).round
        if kb < 200
          puts "  ⚠ #{basename}.vrscene SADECE #{kb} KB → GEOMETRİ YOK (soğuk export)."
          puts "    ÇÖZÜM: V-Ray Render düğmesine bas, araba görününce Stop, sonra Hero.run'ı TEKRAR çalıştır."
        else
          puts "  ✓ #{basename}.vrscene #{kb} KB"
        end
      else
        # Doğrudan SketchUp içi render. DİKKAT: renderer.start ASENKRON döner
        # (render arka planda sürer) → save_vfb_image render bitmeden kaydedebilir.
        # Bu yüzden hero'da EXPORT_VRSCENE=true (vray.exe gözetimsiz batch) tercih edilir.
        renderer.start
        renderer.save_vfb_image(File.join(OUT_DIR, "#{basename}.png"))  # DOĞRULANDI imza: pozisyonel string
      end
    end

    # ---- vray.exe toplu render .bat üretici (EXPORT_VRSCENE=true ise) -------
    VRAY_EXE = 'C:\\Program Files\\Chaos\\V-Ray\\V-Ray for SketchUp\\extension\\vray\\bin\\vray.exe'

    def self.write_bat(test: false)
      # ENGINE=:gpu için -rtEngine=5 (CUDA) gerekir AMA NVIDIA sürücüsü >= 525.60 şart
      # (yoksa "CUDA 12 requires driver 525.60" hatası → siyah render). Sürücü eskiyse :cpu kal.
      eng = (ENGINE == :gpu ? "-rtEngine=5 -rtNoise=0.01" : "")
      # NOT: hero'da arka plan ŞEFFAF DEĞİL → -transparentMode KULLANMA (dekor kalsın).
      # -display=0: VFB penceresi açma, gözetimsiz çalış (DOĞRULANDI 2026-06-11, CPU exit 0).
      lines = ["@echo off", "setlocal"]
      @exported.each do |b|
        vs  = File.join(OUT_DIR, "#{b}.vrscene").tr("/", "\\")
        png = File.join(OUT_DIR, "#{b}.png").tr("/", "\\")
        lines << %Q{echo Rendering #{b} ...}
        lines << %Q{"#{VRAY_EXE}" -sceneFile="#{vs}" -imgFile="#{png}" -imgWidth=#{RES_W} -imgHeight=#{RES_H} -display=0 #{eng}}
      end
      lines << "echo BITTI. #{@exported.size} hero render."
      bat = File.join(OUT_DIR, test ? "render_hero_test.bat" : "render_hero.bat")
      File.write(bat, lines.join("\r\n"))
      puts "[Hero] .bat yazıldı: #{bat}"
      puts "[Hero] Çift tıkla → vray.exe tüm vrscene'leri PNG'ye render eder (gözetimsiz, SketchUp kapalı olabilir)."
    end

    # ---- Sahnenin kamerasından V-Ray RenderView transform satırı üret -------
    # DOĞRULANDI eşleme (2026-06-13, GERÇEK RENDER + ground truth ile teyit): Matrix
    # sütunları = camera.xaxis, camera.yaxis, camera.ZAXIS (=-direction, kameradan geri).
    # DİKKAT: 3. sütun direction DEĞİL zaxis. Ground truth = V-Ray'in kendi export ettiği
    # test_on.vrscene (araba KAREDE); col0/col1/eye birebir aynı, col2 = ZAXIS (direction'ın
    # negatifi). direction yazılırsa col2 ters işaretli olur → kamera arabanın TERSİNE bakar,
    # boş gri oda render edilir (araba yok). Konum = camera.eye (inç, dönüşüm YOK).
    def self.cam_transform_line(scene_name)
      cam = model.pages[scene_name].camera
      x = cam.xaxis; y = cam.yaxis; z = cam.zaxis; e = cam.eye
      ex = e.x.to_f; ey = e.y.to_f; ez = e.z.to_f
      # 150 RAFSIZ'A NİŞAN (mark_source + aim_at_selection ile @offset set edildiyse):
      # yön/uzaklık/fov AYNEN korunur, sadece eye = eye + offset (iki araç merkez farkı) →
      # 150 rafsız, eski 100 rafsızın durduğu kadrajda aynı boyutta görünür. @offset yoksa dokunma.
      if @offset
        ex += @offset[0]; ey += @offset[1]; ez += @offset[2]
      end
      "  transform=Transform(Matrix(" \
        "Vector(#{x.x}, #{x.y}, #{x.z}), " \
        "Vector(#{y.x}, #{y.y}, #{y.z}), " \
        "Vector(#{z.x}, #{z.y}, #{z.z})), " \
        "Vector(#{ex}, #{ey}, #{ez}));"
    end

    RENDERVIEW_RE = /(RenderView\s+\w+\s*\{\s*\n)\s*transform=.*?;\n/m

    # ---- Çalıştır (DETERMİNİSTİK kamera yazımı) -----------------------------
    # SORUN (2026-06-12): döngüde set_camera + renderer.export, V-Ray çeviricinin
    # kamerayı senkronlamaması yüzünden 7 dosyaya da SON kamerayı (ARKAKAPAK) yazıyordu.
    # ÇÖZÜM: tek geometrili base export et, sonra her sahnenin RenderView transform'unu
    # page.camera'dan hesaplayıp metinde değiştir. V-Ray zamanlamasına bağlı DEĞİL.
    def self.run(test: false)
      require "fileutils"; FileUtils.mkdir_p(OUT_DIR)
      unless EXPORT_VRSCENE
        puts "[Hero] EXPORT_VRSCENE=false → eski doğrudan-render yolu (önerilmez)."
        @exported = []
        SCENES.each { |scene, suffix| set_camera(scene); render_one("rumicarts_hero_#{suffix}") }
        return
      end
      scenes = test ? { "ON" => "on" } : SCENES   # test: yalnız ON karesi (framing doğrulama)
      puts "[Hero] #{scenes.size} açı#{test ? ' (TEST — sadece ON)' : ''}. #{RES_W}x#{RES_H}. Çıktı: #{OUT_DIR}"
      puts "[Hero] Nişan: #{@offset ? '150 RAFSIZ (offset AKTİF)' : 'YOK (eski araç!)'}"

      # 1) TEK base vrscene (geometri için; kamerası önemsiz, aşağıda değişecek)
      base_path = File.join(OUT_DIR, "_base.vrscene")
      set_camera(SCENES.keys.first)
      renderer.export(base_path)
      kb = (File.size(base_path) / 1024.0).round
      if kb < 200
        puts "  ⚠ base SADECE #{kb} KB → SOĞUK EXPORT (geometri yok)."
        puts "    ÇÖZÜM: V-Ray Asset Editor > Settings > Engine = CPU yap, Render bas, araba görününce Stop,"
        puts "    sonra Hero.run'ı TEKRAR çalıştır."
        return
      end
      base = File.read(base_path)
      unless base =~ RENDERVIEW_RE
        puts "  ⚠ RenderView transform satırı bulunamadı — vrscene formatı beklenenden farklı, dur."
        return
      end
      puts "  ✓ base #{kb} KB (geometri var). Kameralar deterministik yazılıyor..."

      # 2) Her sahne için RenderView transform'unu kendi kamerasıyla yaz
      @exported = []
      scenes.each_with_index do |(scene, suffix), i|
        tline = cam_transform_line(scene)
        out   = base.sub(RENDERVIEW_RE) { "#{$1}#{tline}\n" }
        name  = "rumicarts_hero_#{suffix}"
        File.write(File.join(OUT_DIR, "#{name}.vrscene"), out)
        @exported << name
        e = model.pages[scene].camera.eye
        puts format("  [%d/%d] %-22s eye=(%.0f, %.0f, %.0f)", i + 1, scenes.size, name, e.x.to_f, e.y.to_f, e.z.to_f)
      end
      File.delete(base_path) rescue nil

      write_bat(test: test)
      puts "[Hero] ✓ Hazırlık bitti. #{@exported.size} vrscene yazıldı#{test ? ' (TEST)' : ''}."
      bat = test ? "render_hero_test.bat" : "render_hero.bat"
      puts "[Hero] Sonra #{OUT_DIR}/#{bat} çift tıkla → PNG."
    end
  end
end

# 1) Teşhis (kameralar farklı mı?):  Rumicarts150Rafsiz::Hero.check_cameras
# 2) (opsiyonel) API keşfi:           Rumicarts150Rafsiz::Hero.discover
# 3) Çalıştır (vrscene + .bat üret):  Rumicarts150Rafsiz::Hero.run
#    → sonra C:\Users\kuruyemis\Desktop\renders\render_hero.bat çift tıkla.
#
# TEKERLEK-YOK seti (DekorTekerlek tag'i SketchUp'ta hazır olmalı):
#   a) Rumicarts150Rafsiz::Hero.teker_off            → tekerlek+çamurluğu gizle
#   b) V-Ray Render bas → tekerleksiz araba görününce Stop (sahneyi ısıt)
#   c) Rumicarts150Rafsiz::Hero.run_tekeryok(test: true)  → 1 test karesi → render_tekeryok_test.bat
#   d) Temizse: Rumicarts150Rafsiz::Hero.run_tekeryok     → 30 kare → render_tekeryok.bat
#   e) Rumicarts150Rafsiz::Hero.teker_on             → tekerleği geri getir (gerekirse)
#
# TENTE-YOK + KOMBİNASYON seti (KumasTente tag'i SketchUp'ta hazır olmalı):
#   A) Tente YOK (tekerlek VAR) — +30 kare:
#      1) Rumicarts150Rafsiz::Hero.set_variant_tags(hide: ["KumasTente"])
#      2) V-Ray Render → tentesiz araba görününce Stop (ısıt)
#      3) Rumicarts150Rafsiz::Hero.run_variant(suffix: "-tenteyok", hide: ["KumasTente"], test: true)
#      4) Temizse: Rumicarts150Rafsiz::Hero.run_variant(suffix: "-tenteyok", hide: ["KumasTente"])
#   B) Tente YOK + Tekerlek YOK — +30 kare:
#      1) Rumicarts150Rafsiz::Hero.set_variant_tags(hide: ["KumasTente", "DekorTekerlek"])
#      2) V-Ray Render → Stop (ısıt)
#      3) Rumicarts150Rafsiz::Hero.run_variant(suffix: "-tekeryok-tenteyok", hide: ["KumasTente", "DekorTekerlek"])
#   C) Hepsi bitince: Rumicarts150Rafsiz::Hero.variant_reset  → tüm tag'leri aç + beyaza dön
#   Çıkan beyaz vrscene'leri Claude Python ile 5 renge çoğaltıp render eder (60 webp).
