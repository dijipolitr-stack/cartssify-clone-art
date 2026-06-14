# =============================================================================
# Rumicarts — HERO Render (SketchUp 2024/2026 + V-Ray 7)
#
# Bu script, DEKORLU sahne dosyası "RUMICARTSRENDERSAHNE.skp" için yazıldı.
# Amaç: sahnedeki 7 kamera açısından birer güzel HERO/yaşam-tarzı render almak.
# Materyal/tag cerrahisi YOK — sahne olduğu gibi (props + ortam) render edilir.
#
# (Varyant grid'i = 120/456 composite render AYRI iştir; o, temiz/izole bir
#  dosya + render_batch.rb ile yapılır. Bu script o işi yapmaz.)
#
# KULLANIM:
#   1) RUMICARTSRENDERSAHNE.skp'yi aç. V-Ray çıktı ayarlarını bir kez yap
#      (çözünürlük + örnekleme); arka planı ŞEFFAF YAPMA (dekor görünsün).
#   2) Extensions > Developer > Ruby Console.
#   3) ÖNCE keşif (1 dk):  RumicartsRender::Hero.discover
#      Çıktıya göre render_one()'daki "# TEYİT ET" satırını netleştir.
#   4) Sonra:  RumicartsRender::Hero.run
# =============================================================================

module RumicartsRender
  module Hero
    # ---- AYARLAR ------------------------------------------------------------
    OUT_DIR = "C:/Users/kuruyemis/Desktop/renders"   # otomatik oluşur
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

    # ---- Gövde materyali keşfi (HEDEFLİ RENK ÇEKİMİ için) -------------------
    # AMAÇ: gövde panelini hangi materyalin boyadığını bulmak. Renk varyantı
    # render'ları için (siyah/yeşil/mavi/kırmızı) o materyalin diffuse rengini
    # döngüyle değiştireceğiz. KULLANIM: SketchUp'ta gövde panelini (büyük beyaz
    # kutu yüzeyi) TIKLA → Ruby Console'da: RumicartsRender::Hero.body_material
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
    # KULLANIM (yansıma testi): RumicartsRender::Hero.set_body_color("kirmizi")
    # → sonra V-Ray Render'a bas. Gövde kırmızı çıkarsa SketchUp rengi V-Ray'e
    # yansıyor demektir → run_colors çalışır. Beyaz kalırsa V-Ray Asset Editor
    # materyali override ediyordur → renk V-Ray API'siyle değiştirilmeli (Claude'a söyle).
    def self.set_body_color(name)
      rgb = BODY_COLORS[name] or raise "Bilinmeyen renk: #{name.inspect}. Geçerli: #{BODY_COLORS.keys.inspect}"
      m = model.materials[BODY_MATERIAL] or raise "Materyal yok: #{BODY_MATERIAL.inspect}"
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
      # 2) Sahnenin tüm özelliklerini (stil/gölge/katman) yükle
      model.pages.selected_page = page
      # 3) Kamerayı DOĞRUDAN ata → tween'i atla, export doğru açıyı yakalar
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

    def self.write_bat
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
      bat = File.join(OUT_DIR, "render_hero.bat")
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
      "  transform=Transform(Matrix(" \
        "Vector(#{x.x}, #{x.y}, #{x.z}), " \
        "Vector(#{y.x}, #{y.y}, #{y.z}), " \
        "Vector(#{z.x}, #{z.y}, #{z.z})), " \
        "Vector(#{e.x.to_f}, #{e.y.to_f}, #{e.z.to_f}));"
    end

    RENDERVIEW_RE = /(RenderView\s+\w+\s*\{\s*\n)\s*transform=.*?;\n/m

    # ---- Çalıştır (DETERMİNİSTİK kamera yazımı) -----------------------------
    # SORUN (2026-06-12): döngüde set_camera + renderer.export, V-Ray çeviricinin
    # kamerayı senkronlamaması yüzünden 7 dosyaya da SON kamerayı (ARKAKAPAK) yazıyordu.
    # ÇÖZÜM: tek geometrili base export et, sonra her sahnenin RenderView transform'unu
    # page.camera'dan hesaplayıp metinde değiştir. V-Ray zamanlamasına bağlı DEĞİL.
    def self.run
      require "fileutils"; FileUtils.mkdir_p(OUT_DIR)
      unless EXPORT_VRSCENE
        puts "[Hero] EXPORT_VRSCENE=false → eski doğrudan-render yolu (önerilmez)."
        @exported = []
        SCENES.each { |scene, suffix| set_camera(scene); render_one("rumicarts_hero_#{suffix}") }
        return
      end
      puts "[Hero] #{SCENES.size} açı. #{RES_W}x#{RES_H}. Çıktı: #{OUT_DIR}"

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
      SCENES.each_with_index do |(scene, suffix), i|
        tline = cam_transform_line(scene)
        out   = base.sub(RENDERVIEW_RE) { "#{$1}#{tline}\n" }
        name  = "rumicarts_hero_#{suffix}"
        File.write(File.join(OUT_DIR, "#{name}.vrscene"), out)
        @exported << name
        e = model.pages[scene].camera.eye
        puts format("  [%d/%d] %-22s eye=(%.0f, %.0f, %.0f)", i + 1, SCENES.size, name, e.x.to_f, e.y.to_f, e.z.to_f)
      end
      File.delete(base_path) rescue nil

      write_bat
      puts "[Hero] ✓ Hazırlık bitti. 7 vrscene FARKLI kameralarla yazıldı."
      puts "[Hero] Teyit: yukarıdaki eye değerleri 7 sahnede farklı olmalı. Sonra render_hero.bat çift tıkla."
    end
  end
end

# 1) Teşhis (kameralar farklı mı?):  RumicartsRender::Hero.check_cameras
# 2) (opsiyonel) API keşfi:           RumicartsRender::Hero.discover
# 3) Çalıştır (vrscene + .bat üret):  RumicartsRender::Hero.run
#    → sonra C:\Users\kuruyemis\Desktop\renders\render_hero.bat çift tıkla.
