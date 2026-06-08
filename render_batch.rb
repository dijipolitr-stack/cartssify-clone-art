# =============================================================================
# Rumicarts — Otomatik Render Script (SketchUp + V-Ray, Ruby Console)
#
# Ne yapar: RENDER_BRIEF.md'deki Faz 1 (24) + Faz 3 (432) render'larını otomatik alır.
# Her iş için: kamerayı Scene'den okur, doğru parça tag'lerini gösterir/gizler,
# materyali/rengi ayarlar, render'ı başlatır, biter bitmez doğru dosya adıyla kaydeder,
# sıradakine geçer.
#
# ÖN KOŞUL: Model RENDER_AUTOMATION.md'deki isimlendirme sözleşmesine göre hazır olmalı
# (tag adları, materyal adları, 6 Scene adı birebir).
#
# KULLANIM: Window > Ruby Console > bu dosyanın tamamını yapıştır > Enter.
# =============================================================================

module RumicartsRender
  # ---- AYARLAR (her çalıştırmada kontrol et) --------------------------------
  BOYUT   = "100"                              # "100" veya "150" (açtığın dosyaya göre)
  OUT_DIR = "C:/Users/kuruyemis/Desktop/renders"  # Çıktı klasörü (yoksa oluşturulur)

  # Brief'teki 6 açı = modeldeki 6 Scene adı (birebir)
  ANGLES = %w[on on-sag on-sol arka arka-sag arka-sol]

  # Renk hex'leri — src/data/configurator.ts ile birebir (site swatch'larıyla aynı)
  COLORS = {
    "beyaz"   => "#f3f1ec",
    "siyah"   => "#1f1f1f",
    "yesil"   => "#5d6a3a",
    "mavi"    => "#34567f",
    "kirmizi" => "#b03a2e",
  }
  COLOR_KEYS = %w[beyaz siyah yesil mavi kirmizi]
  METAL_KEYS = %w[krom pirinc siyah beyaz]

  ALL_TAGS = %w[Govde Metal Tente Tekerlek Raf Tutamac ArkaKapak]

  # ---- SketchUp yardımcıları (güvenilir, sürümden bağımsız) ------------------

  def self.model; Sketchup.active_model; end

  # Sadece verilen tag'leri görünür yap, gerisini gizle.
  def self.show_only(visible_tags)
    model.layers.each do |lyr|
      next if lyr.name == "Layer0"
      lyr.visible = visible_tags.include?(lyr.name)
    end
  end

  # Adı verilen Scene'in kamerasını uygula.
  def self.set_camera(angle)
    page = model.pages[angle]
    raise "Scene bulunamadı: '#{angle}' — RENDER_AUTOMATION.md'deki Scene adlarını kontrol et." unless page
    model.pages.selected_page = page
  end

  # Adı verilen materyalin diffuse rengini hex'e ayarla (gövde/tente için).
  def self.set_material_color(mat_name, hex)
    mat = model.materials[mat_name]
    raise "Materyal bulunamadı: '#{mat_name}'" unless mat
    r = hex[1, 2].to_i(16); g = hex[3, 2].to_i(16); b = hex[5, 2].to_i(16)
    mat.color = Sketchup::Color.new(r, g, b)
  end

  # Gövde materyali ürün finish'ine göre: mat -> Govde_mat, lake -> Govde_lake
  def self.body_material(finish); finish == "lake" ? "Govde_lake" : "Govde_mat"; end

  # ---- V-Ray hook'ları — # TEYİT ET (kurulu V-Ray sürümüne göre) -------------
  # Bu iki fonksiyon V-Ray sürümüne göre değişir. Aşağısı bilinen yaklaşımdır;
  # sürümün belli olunca netleştirilecek. Gerisi hazır.

  # Render çıktı yolunu + çözünürlüğü (2000px) ayarla. # TEYİT ET
  def self.vray_set_output(path)
    # V-Ray Asset Editor > Settings > Output: image file = path, size = 2000x2000, alpha=on
    # Tipik: VRay::Settings veya VRayForSketchUp API üzerinden ayarlanır.
    @pending_output = path
    # TODO(V-Ray sürümü): output file path + 2000x2000 + PNG/alpha set et.
  end

  # Render'ı başlat ve BİTENE KADAR bekle, sonra block'u çağır. # TEYİT ET
  # Not: bloklayan sleep ÇALIŞMAZ — UI.start_timer ile rendering? yoklanır.
  def self.vray_render_and_wait(&on_done)
    VRayForSketchUp.launch_vray_render   # TEYİT ET: sürüme göre launch_vray_render / batch
    @poll = UI.start_timer(1.0, true) do
      unless VRay::LiveScene.active.rendering?   # TEYİT ET: completion kontrolü
        UI.stop_timer(@poll)
        on_done.call
      end
    end
  end

  # Zemin gölgesi: yalnız gövde/hero katmanında açık. # TEYİT ET (opsiyonel)
  def self.vray_ground_shadow(on)
    # V-Ray ground plane / shadow catcher görünürlüğü.
  end

  # ---- İş listesi (kombinasyonlar) — brief ile birebir -----------------------

  def self.build_jobs
    jobs = []
    %w[mat lake].each do |finish|
      product = "#{BOYUT}-#{finish}"   # ör. 100-mat
      body = body_material(finish)

      ANGLES.each do |angle|
        # FAZ 1 — hero (tam donanımlı, tüm parçalar görünür, gövde beyaz)
        jobs << {
          file: "#{product}_#{angle}_hero",
          setup: proc {
            show_only(ALL_TAGS); set_camera(angle)
            set_material_color(body, COLORS["beyaz"])
            set_material_color("Tente_mat", COLORS["beyaz"])
            vray_ground_shadow(true)
          }
        }

        # FAZ 3a — Gövde (yalnız gövde, 5 renk, zemin gölgesi AÇIK)
        COLOR_KEYS.each do |c|
          jobs << { file: "#{product}_#{angle}_govde-#{c}", setup: proc {
            show_only(%w[Govde]); set_camera(angle)
            set_material_color(body, COLORS[c]); vray_ground_shadow(true)
          } }
        end

        # FAZ 3b — Metal (yalnız metal, 4 varyant — hazır materyal ata)
        METAL_KEYS.each do |m|
          jobs << { file: "#{product}_#{angle}_metal-#{m}", setup: proc {
            show_only(%w[Metal]); set_camera(angle); vray_ground_shadow(false)
            # Metal parçasına Metal_#{m} materyalini ata:
            assign_material_to_tag("Metal", "Metal_#{m}")
          } }
        end

        # FAZ 3c — Tente (yalnız tente, 5 renk)
        COLOR_KEYS.each do |c|
          jobs << { file: "#{product}_#{angle}_tente-#{c}", setup: proc {
            show_only(%w[Tente]); set_camera(angle); vray_ground_shadow(false)
            set_material_color("Tente_mat", COLORS[c])
          } }
        end

        # FAZ 3d — Dekoratif tekerlek (tek)
        jobs << { file: "#{product}_#{angle}_tekerlek", setup: proc {
          show_only(%w[Tekerlek]); set_camera(angle); vray_ground_shadow(false)
        } }

        # FAZ 3e — Raf + Tutamaç (iki ayrı render)
        %w[raf tutamac].each do |rt|
          tag = rt == "raf" ? "Raf" : "Tutamac"
          jobs << { file: "#{product}_#{angle}_#{rt}", setup: proc {
            show_only([tag]); set_camera(angle); vray_ground_shadow(false)
          } }
        end

        # FAZ 3f — Arka kapak (tek)
        jobs << { file: "#{product}_#{angle}_arkakapak", setup: proc {
          show_only(%w[ArkaKapak]); set_camera(angle); vray_ground_shadow(false)
        } }
      end
    end
    jobs
  end

  # Bir tag'deki tüm entity'lere materyal ata (metal varyant değişimi için).
  def self.assign_material_to_tag(tag_name, mat_name)
    mat = model.materials[mat_name]
    raise "Materyal bulunamadı: '#{mat_name}'" unless mat
    model.entities.grep(Sketchup::Drawingelement).each do |e|
      e.material = mat if e.layer && e.layer.name == tag_name
    end
  end

  # ---- Ana kuyruk işleyici (sıralı, render bitince sonraki) ------------------

  def self.run
    require "fileutils"
    FileUtils.mkdir_p(OUT_DIR)
    @jobs = build_jobs
    @total = @jobs.size
    @done = 0
    puts "[Rumicarts] #{@total} render kuyruğa alındı. Çıktı: #{OUT_DIR}"
    process_next
  end

  def self.process_next
    if @jobs.empty?
      puts "[Rumicarts] ✓ Bitti — #{@done}/#{@total} render alındı."
      return
    end
    job = @jobs.shift
    path = File.join(OUT_DIR, "#{job[:file]}.png")
    job[:setup].call          # kamera + tag + materyal ayarla
    vray_set_output(path)     # # TEYİT ET
    @done += 1
    puts "[#{@done}/#{@total}] #{job[:file]} ..."
    vray_render_and_wait { process_next }   # bitince sıradaki
  end
end

# Çalıştır:
RumicartsRender.run
