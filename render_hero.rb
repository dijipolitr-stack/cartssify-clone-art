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
