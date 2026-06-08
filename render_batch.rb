# =============================================================================
# Rumicarts — Otomatik Render (SketchUp 2026 + V-Ray 7, GPU/CUDA)
#
# TRIAL-OPTIMIZE: Faz 1 (24 hero) + Faz 2 (96 gövde rengi) = 120 render.
# Bu iki faz COMPOSITE'tir → modeli 7 parçaya AYIRMAYA gerek yok. Sadece:
#   - 6 kamera Scene'i (on, on-sag, on-sol, arka, arka-sag, arka-sol)
#   - Gövde için iki materyal: "Govde_mat" ve "Govde_lake" (script rengini değiştirir)
#   - Tente beyaz + metal krom modeldeki haliyle kalır (tam donanımlı showcase)
#
# Faz 3 (432 katmanlı render, 7 tag'e ayırma) AYRI ve sonraki iş — bu script kapsamı dışı.
#
# KULLANIM:
#   1) Doğru dosyayı aç (rumicarts_100.skp / rumicarts_150.skp) ve BOYUT'u ayarla.
#   2) Extensions > Developer > Ruby Console.
#   3) ÖNCE method keşfi (1 dk): aşağıdaki RumicartsRender.discover çağrısını çalıştır,
#      konsoldaki çıktıya göre render_one()'daki # TEYİT ET satırını netleştir.
#   4) Sonra RumicartsRender.run ile başlat.
# =============================================================================

module RumicartsRender
  # ---- AYARLAR --------------------------------------------------------------
  BOYUT   = "100"                                  # "100" veya "150"
  OUT_DIR = "C:/Users/kuruyemis/Desktop/renders"   # çıktı klasörü (otomatik oluşur)
  ENGINE  = :gpu                                    # :gpu (CUDA, GTX 1650 Ti) | :cpu
  RES     = 2000                                    # 4GB VRAM darsa 1600 yap

  ANGLES = %w[on on-sag on-sol arka arka-sag arka-sol]

  # Renkler — src/data/configurator.ts ile birebir hex (site swatch'larıyla aynı)
  COLORS = {
    "beyaz"   => "#f3f1ec", "siyah" => "#1f1f1f", "yesil" => "#5d6a3a",
    "mavi"    => "#34567f", "kirmizi" => "#b03a2e",
  }

  def self.model; Sketchup.active_model; end

  # ---- 1 DAKİKALIK METHOD KEŞFİ (dökümandan değil, canlı öğren) --------------
  # Bunu bir kez çalıştır; render/output/vrscene method adlarını konsola yazar.
  def self.discover
    puts "== VRayForSketchUp methods =="
    puts (defined?(VRayForSketchUp) ? VRayForSketchUp.methods(false).grep(/render|output|vrscene|export|res/i).sort : "VRayForSketchUp tanımsız")
    puts "== VRay::Context.active methods =="
    if defined?(VRay) && VRay::Context.active
      puts VRay::Context.active.methods.grep(/render|output|vrscene|export|image|size|res/i).sort
      puts "== scene methods =="
      puts VRay::Context.active.scene.methods.grep(/render|output|export|vrscene/i).sort
    else
      puts "VRay::Context tanımsız — V-Ray yüklü mü?"
    end
  end

  # ---- SketchUp yardımcıları (güvenilir) ------------------------------------
  def self.set_camera(angle)
    page = model.pages[angle]
    raise "Scene yok: '#{angle}' — 6 kamerayı bu adlarla Scene yap." unless page
    model.pages.selected_page = page
  end

  def self.set_body(finish, hex)
    name = (finish == "lake" ? "Govde_lake" : "Govde_mat")
    mat = model.materials[name]
    raise "Materyal yok: '#{name}' — gövdeye bu materyali ata." unless mat
    r = hex[1,2].to_i(16); g = hex[3,2].to_i(16); b = hex[5,2].to_i(16)
    mat.color = Sketchup::Color.new(r, g, b)
  end

  # ---- V-Ray render — # TEYİT ET (discover çıktısına göre netleştir) ---------
  # En sağlam yol: her kombinasyon için .vrscene export et, sonra vray.exe ile
  # toplu render et (aşağıdaki write_bat). Alternatif: doğrudan SketchUp'tan render.
  EXPORT_VRSCENE = true   # true: vrscene export (vray.exe ile sonra render) — ÖNERİLEN

  def self.render_one(basename)
    if EXPORT_VRSCENE
      path = File.join(OUT_DIR, "#{basename}.vrscene")
      # TEYİT ET (discover): vrscene export method. Muhtemel:
      #   VRayForSketchUp.export_vrscene(path)  -veya-  VRay::Context.active.export(path)
      VRayForSketchUp.export_vrscene(path)
      @exported << basename
    else
      img = File.join(OUT_DIR, "#{basename}.png")
      # TEYİT ET (discover): output path + RES + render başlat (senkron beklemeli).
      VRayForSketchUp.launch_vray_render
    end
  end

  # ---- vray.exe toplu render .bat üretici (EXPORT_VRSCENE=true ise) ----------
  VRAY_EXE = 'C:\\Program Files\\Chaos\\V-Ray\\V-Ray for SketchUp\\extension\\vray\\bin\\vray.exe'

  def self.write_bat
    eng = (ENGINE == :gpu ? "-rtEngine=5 -rtNoise=0.01" : "")  # 5=CUDA; # TEYİT ET flag
    lines = ["@echo off", "setlocal"]
    @exported.each do |b|
      vs  = File.join(OUT_DIR, "#{b}.vrscene").tr("/", "\\")
      png = File.join(OUT_DIR, "#{b}.png").tr("/", "\\")
      lines << %Q{echo Rendering #{b} ...}
      lines << %Q{"#{VRAY_EXE}" -sceneFile="#{vs}" -imgFile="#{png}" -imgWidth=#{RES} -imgHeight=#{RES} -transparentMode=2 #{eng}}
    end
    lines << "echo BITTI. #{@exported.size} render."
    bat = File.join(OUT_DIR, "render_all_#{BOYUT}.bat")
    File.write(bat, lines.join("\r\n"))
    puts "[Rumicarts] .bat yazıldı: #{bat}"
    puts "[Rumicarts] Çift tıkla → vray.exe tüm vrscene'leri PNG'ye render eder (gözetimsiz)."
  end

  # ---- İş listesi: Faz 1 (hero) + Faz 2 (gövde renkleri) ---------------------
  def self.build_jobs
    jobs = []
    %w[mat lake].each do |finish|
      product = "#{BOYUT}-#{finish}"
      ANGLES.each do |angle|
        COLORS.each do |cname, hex|
          # beyaz → Faz 1 hero; diğer 4 renk → Faz 2 govde-{renk}
          variant = (cname == "beyaz" ? "hero" : "govde-#{cname}")
          jobs << { file: "#{product}_#{angle}_#{variant}",
                    setup: proc { set_camera(angle); set_body(finish, hex) } }
        end
      end
    end
    jobs   # 2 finish × 6 açı × 5 renk = 60/dosya × 2 dosya = 120
  end

  # ---- Çalıştır -------------------------------------------------------------
  def self.run
    require "fileutils"; FileUtils.mkdir_p(OUT_DIR)
    @exported = []
    jobs = build_jobs
    puts "[Rumicarts] #{jobs.size} iş (BOYUT=#{BOYUT}). Engine=#{ENGINE}, #{RES}px. Çıktı: #{OUT_DIR}"
    jobs.each_with_index do |job, i|
      job[:setup].call
      render_one(job[:file])
      puts "[#{i+1}/#{jobs.size}] #{job[:file]}"
    end
    write_bat if EXPORT_VRSCENE
    puts "[Rumicarts] ✓ Hazırlık bitti."
  end
end

# Önce:  RumicartsRender.discover
# Sonra: RumicartsRender.run
