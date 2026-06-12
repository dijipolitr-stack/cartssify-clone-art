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

    # ---- Çalıştır -----------------------------------------------------------
    def self.run
      require "fileutils"; FileUtils.mkdir_p(OUT_DIR)
      @exported = []
      puts "[Hero] #{SCENES.size} açı. Engine=#{ENGINE}, #{RES_W}x#{RES_H}. Çıktı: #{OUT_DIR}"
      SCENES.each_with_index do |(scene, suffix), i|
        set_camera(scene)
        base = "rumicarts_hero_#{suffix}"
        render_one(base)
        puts "[#{i + 1}/#{SCENES.size}] #{base}  (sahne: #{scene})"
      end
      write_bat if EXPORT_VRSCENE
      puts "[Hero] ✓ Hazırlık bitti."
    end
  end
end

# 1) Teşhis (kameralar farklı mı?):  RumicartsRender::Hero.check_cameras
# 2) (opsiyonel) API keşfi:           RumicartsRender::Hero.discover
# 3) Çalıştır (vrscene + .bat üret):  RumicartsRender::Hero.run
#    → sonra C:\Users\kuruyemis\Desktop\renders\render_hero.bat çift tıkla.
