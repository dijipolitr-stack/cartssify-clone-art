import type { en } from "./en";

// Strict shape match with English dictionary
export const tr: typeof en = {
  topBar: "Dünya Çapında Kargo",

  nav: {
    products: "Ürünler",
    features: "Özellikler",
    about: "Hakkımızda",
    contact: "İletişim",
    faq: "SSS",
    shopNow: "Mağaza",
    shop: "Mağaza",
    home: "Ana sayfa",
    allProducts: "Tüm ürünler",
  },

  hero: {
    tagline: "Etkinlik & Perakende İçin Mobil Tezgah Çözümleri",
    cta: "Başla",
  },

  features: {
    customize: {
      eyebrow: "01 — Özelleştir",
      title: "Markana özel sergi tezgahını tasarla.",
      body: "Vizyonunu hayata geçir. Renk, malzeme ve kaplamayı sen seç; markanla birebir uyumlu, sana ait bir tezgah ortaya çıksın.",
      cta: "Tasarla",
    },
    portable: {
      eyebrow: "02 — Taşınabilir",
      title: "Dayanıklı ve gerçekten taşınabilir.",
      body: "Etkinlik bitince tezgahı katlayıp düz paket haline getir. Frenli sağlam tekerleklerle bir sonraki mekana taşımak çocuk oyuncağı.",
      cta: "Daha fazla",
    },
    iconic: {
      eyebrow: "03 — İkonik",
      title: "Unutulmaz markalar için bir tuval.",
      body: "Sade beyazdan iddialı renk geçişlerine kadar — tezgahların kendisi bir gösteri unsuru, müşterinin aklında kalan bir deneyim olur.",
      cta: "Galeriyi gör",
    },
  },

  useCases: {
    eyebrow: "Kullanım alanları",
    title: "Her tür iş için tasarlandı.",
    body: "İster bir kahve pop-up'ı kuruyor ol, ister marka etkinliği planlıyor, ister hafta sonu pazarında stant açıyor — sana uygun bir Rumicart konfigürasyonu mutlaka var.",
    coffee: {
      eyebrow: "Kahve Pop-up & Etkinlik",
      title: "Her yerde kahve servisi.",
      body: "Özel etkinliklerden marka tanıtımlarına kadar — kompakt tezgahlarımızla şık bir şekilde içecek servisi yapmak için ihtiyacın olan her şey: hızlı kurulum, kolay taşıma, markalanabilir tente.",
    },
    retail: {
      eyebrow: "Sergi & Perakende",
      title: "Sat, ikram et, sergile.",
      body: "Geniş çalışma yüzeyi, açılır yan kanatlar ve markan için temiz bir tuval — ürün lansmanları, hafta sonu pazarları ve pop-up perakende için ideal.",
    },
    disclaimer:
      "Lifestyle fotoğraflarında görünen ekipman (kahve makinesi, sergi düzeni, tabela vb.) ayrıca satılmaktadır.",
  },

  about: {
    eyebrow: "Rumicarts Hakkında",
    title: "El işçiliği. Yola dayanıklı.",
    body1:
      "Rumicarts; kafeler, markalar ve etkinlik ekipleri için mobil sergi tezgahı üreten yeni bir atölye. Her tezgah, talebine göre el işçiliğiyle üretilir — raftan ürün yok, ismi geçmeyen bir fabrikadan kutu gelmiyor.",
    body2:
      "12mm marin kontrplakla başlıyor, her parçayı özenle bitiriyoruz: pürüzsüz kenarlar, frenli tekerlekler, logon ya da görsellerin için hazır paneller. İster bir kahve pop-up'ı açıyor ol, ister bir marka etkinliği için sahne kuruyor — tezgah atölyeden kullanıma hazır çıkar.",
    body3:
      "Bilinçli olarak küçüğüz. Yani yapımcıyla doğrudan konuşursun; sayısız müşteriden biri olmazsın. Tezgahın hak ettiği özeni görür.",
    points: [
      "İstanbul atölyemizde el yapımı",
      "12mm marin kontrplak, gıdaya uygun kaplamalar",
      "Düz paket katlanır — dünyaya kargo",
      "Özel paneller, renkler, markalama",
    ],
  },

  trust: {
    items: [
      { k: "Üretim", v: "İstanbul" },
      { k: "Sana özel", v: "Tasarım" },
      { k: "Dünyaya", v: "Kargo" },
      { k: "Doğrudan", v: "Üreticiden" },
    ],
  },

  contact: {
    eyebrow: "Teklif al",
    title: "Tezgahını anlat bize.",
    body: "Mesajını gönder — bir iş günü içinde seçenekler, fiyat ve teslimat süresiyle dönüyoruz.",
    hours: "Çalışma saatleri · Pazartesi–Cuma · 09:00–18:00 (Türkiye)",
    form: {
      name: "Adın",
      namePlaceholder: "Adın Soyadın",
      email: "E-posta (opsiyonel)",
      emailPlaceholder: "ornek@email.com",
      subject: "İlgilendiğin konu",
      subjects: {
        quote: "Mevcut bir tezgah için teklif",
        custom: "Tamamen özel üretim",
        question: "Genel soru",
      },
      message: "Mesaj",
      messagePlaceholder: "Ne tür bir tezgah istiyorsun? Adet, zaman çizelgesi, marka detayları — ne yazarsan yardımcı olur.",
      submit: "WhatsApp'tan gönder",
      hint: "'Gönder'e bastığında WhatsApp mesajın hazır şekilde açılır. Göndermeden önce kontrol et.",
      required: "Göndermeden önce lütfen adını ve kısa bir mesaj ekle.",
    },
  },

  footer: {
    copyright: (year: number) => `© ${year} Rumicarts. Tüm hakları saklıdır.`,
    tagline: "Etkinlikler, perakende ve marka aktivasyonları için dünya çapında el yapımı mobil sergi tezgahları.",
    shop: "Mağaza",
    company: "Şirket",
    legal: "Yasal",
    contactInfo: "İletişim bilgileri",
    privacy: "Gizlilik politikası",
    terms: "Kullanım koşulları",
    shippingPolicy: "Kargo politikası",
    refundPolicy: "İade politikası",
    instagram: "Instagram",
    pinterest: "Pinterest",
    contact: "İletişim",
  },

  cart: {
    title: "Sepetin",
    close: "Sepeti kapat",
    empty: "Sepetin boş.",
    browse: "Ürünlere göz at",
    subtotal: "Ara toplam",
    shippingNote: "Kargo ve vergiler ödeme adımında hesaplanır.",
    checkout: "Ödemeye geç",
    decrease: "Azalt",
    increase: "Artır",
    remove: "Kaldır",
  },

  productsList: {
    eyebrow: "Koleksiyon",
    title: "Tüm Ürünler",
    intro:
      "Mobil tezgahlar, modüler barlar ve sergi çözümleri — etkinlikler, pop-up'lar ve gezici perakende için.",
    comingSoon: "Yakında",
    comingSoonHint: "Yakında satışta — iletişime geç",
  },

  productDetail: {
    notFound: "Ürün bulunamadı",
    backToProducts: "Ürünlere dön",
    addToCart: "Sepete ekle",
    customize: "Özelleştir",
    description: "Açıklama",
    features: "Özellikler",
    specs: "Teknik özellikler",
    specsComingSoon: "Detaylı boyut ve ağırlık bilgileri yakında eklenecek.",
    askForSpecs: "Boyutları sor",
  },

  language: {
    label: "Dil",
    en: "English",
    tr: "Türkçe",
  },

  legalPages: {
    lastUpdated: (date: string) => `Son güncelleme · ${date}`,
    backHome: "Ana sayfaya dön",
  },

  privacy: {
    eyebrow: "Yasal",
    title: "Gizlilik Politikası",
    intro:
      "Bu gizlilik politikası, bu siteyi kullandığında Rumicarts'ın hangi kişisel bilgileri topladığını, neden topladığını ve nasıl işlediğini açıklar.",
    sections: [
      {
        heading: "Biz kimiz",
        body: "Rumicarts, İstanbul'da bulunan, etkinlikler ve perakende için mobil sergi tezgahları üreten küçük bir atölyedir. Bu politikada 'biz' veya 'bize' geçtiğinde, Rumicarts'ı yöneten kişileri kasteder.",
      },
      {
        heading: "Topladığımız bilgiler",
        body: "Sadece gönüllü olarak verdiğin bilgileri topluyoruz. Sitedeki iletişim formu adını ve isteğe bağlı bir e-posta adresini, ayrıca göndermeyi seçtiğin mesajı sorar. Bu sitede ödeme bilgisi toplamıyor veya saklamıyoruz — ödeme adımı, ayrı bir sayfada ödeme sağlayıcımız tarafından yürütülür.",
      },
      {
        heading: "Bilgilerini nasıl kullanıyoruz",
        body: "Gönderdiğin bilgileri, sorgunu cevaplamak, sana fiyat teklifi sunmak ve siparişinin takibi için kullanırız. Verilerini satmıyoruz ve siparişini yerine getirmek için kesinlikle gerekli olmadıkça (örneğin kargo şirketleriyle) üçüncü taraflarla paylaşmıyoruz.",
      },
      {
        heading: "Çerezler & analitik",
        body: "Bu site, dil tercihini hatırlamak ve sitenin nasıl kullanıldığını anlamak için (örneğin hangi sayfalar daha popüler) az sayıda çerez kullanabilir. Bu analitikler toplu (anonim) — seni kişisel olarak tanımlamaz.",
      },
      {
        heading: "Hakların",
        body: "İstediğin zaman senin hakkında hangi bilgileri tuttuğumuzu sorabilir, düzeltilmesini veya silinmesini isteyebilirsin. Talebini sitedeki iletişim formundan ilet — makul bir süre içinde döneceğiz.",
      },
      {
        heading: "Bu politikada değişiklikler",
        body: "Bu politikayı güncellersek, sayfanın üst kısmındaki 'Son güncelleme' tarihini değiştiririz. Değişiklikten sonra siteyi kullanmaya devam etmen, güncellenen politikayı kabul ettiğin anlamına gelir.",
      },
    ],
  },

  terms: {
    eyebrow: "Yasal",
    title: "Kullanım Koşulları",
    intro:
      "Bu koşullar, rumicarts.com'u ziyaret ettiğinde veya bizden bir tezgah satın aldığında geçerlidir. Sipariş vererek bunları kabul ettiğini beyan edersin.",
    sections: [
      {
        heading: "Ürünlerimizin özel üretim niteliği",
        body: "Her Rumicarts tezgahı sipariş üzerine el ile üretilir. Tezgahının üretimi başladıktan sonra, tam iade sunmamız mümkün değildir — neyin mümkün olduğu/olmadığı için İade Politikası'na bak. Standart üretim süresi, yazılı olarak başka türlü mutabık kalmadıkça 2–3 haftadır.",
      },
      {
        heading: "Fiyatlandırma & para birimi",
        body: "Sitedeki fiyatlar aksi belirtilmedikçe USD cinsindendir. Ödediğin son tutar, ülkene göre yerel vergiler, gümrük resimleri ve kargo ücretlerine tabi olabilir. Herhangi bir ödeme alınmadan önce toplam tutarı sana onaylatırız.",
      },
      {
        heading: "Kargo & teslimat",
        body: "Teslimat süresi ve kargo seçenekleri her sipariş için ayrı ayrı onaylanır. Uluslararası kargo şirketleriyle dünyaya gönderim yapıyoruz. Bir tezgah atölyemizden ayrıldığında, teslimattan kargo şirketi sorumludur. Detaylar için Kargo Politikası'na bak.",
      },
      {
        heading: "Özelleştirme doğruluğu",
        body: "Belirttiğin renk, malzeme ve kaplamayı en iyi şekilde eşleştirmeye çalışırız. Dijital önizlemeler ile son ürün arasında ufak farklar normaldir — ahşap deseni, renk partileri ve ortam ışığı son görünümü etkiler. Bu doğal varyasyonları kusur olarak değerlendirmiyoruz.",
      },
      {
        heading: "Sorumluluk sınırlandırması",
        body: "Rumicarts; tezgahın amacı dışında kullanılması, belgelenen kapasitenin üzerinde yüklenmesi veya tasarlanan amacı dışında (sergi, perakende, hafif gıda servisi) kullanılması nedeniyle oluşan zararlardan sorumlu değildir.",
      },
      {
        heading: "Geçerli hukuk",
        body: "Bu koşullar Türkiye Cumhuriyeti yasalarına tabidir. Rumicarts siparişinden doğan herhangi bir uyuşmazlık İstanbul mahkemelerinde çözülür.",
      },
    ],
  },

  shipping: {
    eyebrow: "Bilgi",
    title: "Kargo Politikası",
    intro:
      "Rumicarts'ı dünyanın her yerine gönderiyoruz. Her sipariş, tezgah konfigürasyonuna göre boyutlandırılmış sağlam bir sandık veya karton içinde düz paket olarak gönderilir.",
    sections: [
      {
        heading: "Üretim süresi",
        body: "Çoğu tezgah, sipariş onayından sonra 2–3 hafta içinde üretilip kargolanır. Daha büyük veya tamamen özel siparişler daha uzun sürebilir — ödeme almadan önce sana süreyi söyleriz.",
      },
      {
        heading: "Kargo şirketleri",
        body: "Boyuta göre saygın uluslararası kargo şirketleri (DHL, FedEx, UPS veya hava/deniz kargo) kullanırız. Çoklu tezgah büyük siparişleri için kargo aracılarıyla çalışabiliriz — kargo seçeneklerin sipariş sürecinde onaylanır.",
      },
      {
        heading: "Gümrük, vergi ve resimler",
        body: "Uluslararası gönderiler, varış ülkesinde gümrük ücretleri, ithalat vergileri veya KDV'ye tabi olabilir. Bunlar alıcının sorumluluğundadır ve aksi mutabık kalınmadıkça verdiğimiz fiyat teklifine dahil değildir.",
      },
      {
        heading: "Kargo takibi",
        body: "Siparişin kargolandıktan sonra sana bir takip numarası gönderiyoruz. Kargonun durumunu kargo şirketinin sitesinden takip edebilirsin.",
      },
      {
        heading: "Nakliyede hasar",
        body: "Ürün sana ulaştığında hemen kontrol et. Hasarlı bir şey varsa fotoğraf çek ve 7 gün içinde bizimle iletişime geç. Sorunu çözmek için kargo şirketiyle birlikte çalışırız.",
      },
    ],
  },

  refund: {
    eyebrow: "Bilgi",
    title: "İade Politikası",
    intro:
      "Her Rumicarts tezgahı özel üretildiği için iade politikamız, raftan satılan üründen farklıdır. Sipariş vermeden önce lütfen dikkatlice oku.",
    sections: [
      {
        heading: "Üretim başlamadan önce",
        body: "Üretim başlamadan önce siparişini iptal edersen tam iade alırsın. Üretimin ne zaman başlayacağını sana açıkça bildiririz, böylece net bir kesim noktan olur.",
      },
      {
        heading: "Üretim başladıktan sonra",
        body: "Malzemeleri kestiğimiz veya montaja başladığımızda, tezgahın artık sana özel ve yeniden satılamaz. Bu aşamada tam iade sunamayız. Üretim aşamasına ve halihazırda kullanılan malzemelere göre kısmi iade önerebiliriz (kararı bizim takdirimizdedir).",
      },
      {
        heading: "Kusurlar",
        body: "Tezgahın bir üretim kusuruyla ulaşırsa (yanlış renk, yapısal hata, eksik parça), 14 gün içinde fotoğraflarla bizimle iletişime geç. Etkilenen parçayı onarır, değiştirir veya iade ederiz — seçim senin.",
      },
      {
        heading: "İadeler",
        body: "Özel üretim tezgahlarda fikir değişikliği için iade kabul etmiyoruz. Özel üretim olmayan ürünler için (örn. ek raflar, aksesuarlar) ürünü 14 gün içinde kullanılmamış olarak iade edebilirsin; iade kargosu sana aittir.",
      },
    ],
  },

  contactInfo: {
    eyebrow: "Bilgi",
    title: "İletişim Bilgileri",
    intro: "Rumicarts'a nasıl ulaşacağın ve ulaştığında ne bekleyebileceğin.",
    sections: [
      {
        heading: "Bize ulaş",
        body: "Bize ulaşmanın en hızlı yolu ana sayfadaki iletişim formu — navigasyondan 'İletişim'e tıkla. Form, mesajını WhatsApp Business hattımıza gönderir.",
      },
      {
        heading: "Çalışma saatleri",
        body: "Pazartesi–Cuma, 09:00 – 18:00 Türkiye saati. Bu saatler dışındaki mesajlar bir sonraki iş günü cevaplanır.",
      },
      {
        heading: "Yanıt süresi",
        body: "Her teklif talebine bir iş günü içinde dönmeyi hedefliyoruz. Geri dönüş alamadıysan önce spam klasörünü kontrol et, sonra tekrar yaz.",
      },
      {
        heading: "Atölye ziyaretleri",
        body: "Atölyemiz İstanbul'da. Ziyaretler sadece randevu ile mümkün — önce iletişim formundan yaz.",
      },
      {
        heading: "Şirket adı & kayıt bilgileri",
        body: "Rumicarts bir ticari unvandır. Tam şirket kayıt bilgileri talep üzerine ve sipariş faturalarında verilir.",
      },
    ],
  },

  faq: {
    eyebrow: "Yardım",
    title: "Sıkça Sorulan Sorular",
    intro: "Sipariş verme, özelleştirme, kargolama ve Rumicarts tezgahını kullanma hakkındaki yaygın sorular.",
    categories: [
      {
        title: "Sipariş & özelleştirme",
        items: [
          {
            q: "Tezgahı nasıl sipariş ederim?",
            a: "Ürünlere göz at, ihtiyacına uygun modeli seç, sonra 'Özelleştir'e tıklayarak renk, malzeme ve donanımı seç. Yapılandırdığın tezgahı sepete ekleyip ödeyebilir veya özel teklif için iletişim formundan mesaj atabilirsin.",
          },
          {
            q: "Katalogda olmayan bir tezgahı özelleştirebilir miyim?",
            a: "Evet. İletişim formundan kısa bir brief gönder — eskizler ve fotoğraflar yardımcı olur. Seçenekler, fiyat ve teslimat süresiyle döneceğiz. Çoğu modüler değişiklik (boyut, renk, donanım, marka paneli) bizim için rutindir.",
          },
          {
            q: "Logomu veya markamı ekleyebilir miyim?",
            a: "Evet. Özelleştir popup'ında logonu yükleyebilirsin (PNG veya SVG en iyi sonucu verir). Karmaşık markalama için baskılı paneller, vinil kaplamalar ve oyma plakalar da yapabiliriz. Mesajında belirt, fiyat verelim.",
          },
          {
            q: "Hangi malzemeleri kullanıyorsunuz?",
            a: "Tezgah gövdeleri 12 mm marin kontrplaktan yapılır (15 mm yükseltme olarak mevcut). Gıdaya uygun boya ve laminatlarla kaplıyoruz. Donanım varsayılan olarak paslanmaz çelik; pirinç yükseltme olarak mevcut.",
          },
        ],
      },
      {
        title: "Üretim süresi & kargo",
        items: [
          {
            q: "Üretim ne kadar sürer?",
            a: "Çoğu sipariş 2–3 haftada üretilir. Daha büyük konfigürasyonlar (çoklu tezgah barlar, U-şekli kurulumlar) 3–4 hafta sürebilir. Ödemeden önce kendi siparişinin süresini onaylarız.",
          },
          {
            q: "Dünyaya kargo yapıyor musunuz?",
            a: "Evet. Boyuta göre DHL, FedEx, UPS veya kargo aracıları kullanarak küresel olarak kargolama yapıyoruz. Gümrük resimleri ve ithalat vergileri alıcının sorumluluğundadır — detaylar için Kargo Politikası'na bak.",
          },
          {
            q: "Tezgah nasıl paketleniyor?",
            a: "Tezgahlar özel sandıklarda veya ağır kartonlarda düz paket olarak kargolanır. Kurulum kolaydır — resimli talimatlar veriyoruz, sadece temel aletler yeterli.",
          },
        ],
      },
      {
        title: "Kullanım & bakım",
        items: [
          {
            q: "Tezgah ne kadar ağırlık taşıyabilir?",
            a: "Modele göre değişir — her ürün sayfasındaki Teknik Özellikler bölümüne bak. Genel olarak, standart Cart 12 çalışma yüzeyi 150 kg'a kadar taşır, her raf ise 80 kg'a kadar destek sağlar.",
          },
          {
            q: "Tezgahı dış mekanda kullanabilir miyim?",
            a: "Tezgah, üstü kapalı dış mekan kullanımı için tasarlandı (çadır, sundurma veya tente altında). Suya dayanıklıdır ancak tamamen su geçirmez değildir — uzun süreli yağmur teması ahşaba zarar verir. Kullanmadığında örtmeni veya saklamanı öneririz.",
          },
          {
            q: "Nasıl temizlerim?",
            a: "Nemli bir bezle ve hafif sabunla sil. Boyalı veya laminatlı yüzeylerde sert solventlerden kaçın. Gıda servisi kullanımı için yerel hijyen kurallarını takip et.",
          },
        ],
      },
      {
        title: "Fiyat & ödeme",
        items: [
          {
            q: "Neden fiyat aralığı var?",
            a: "Fiyatlar boyuta, malzeme yükseltmelerine, özelleştirmeye ve adete göre değişir. Her teklif senin spesifik konfigürasyonun için yapılır, yani sadece sipariş ettiğin için ödersin.",
          },
          {
            q: "Toptan veya yüksek adet indirimi var mı?",
            a: "Evet. Aynı konfigürasyondan 5+ tezgah için ticari fiyat sunuyoruz. Gereksinimini iletişim formundan gönder, özel teklif çıkaralım.",
          },
          {
            q: "Hangi ödeme yöntemlerini kabul ediyorsunuz?",
            a: "Banka havalesi, kredi/banka kartı (ödeme sağlayıcımız aracılığıyla) ve büyük siparişler için aşamalı ödeme (peşinat + tamamlanmada bakiye) ile faturalama düzenleyebiliriz.",
          },
        ],
      },
    ],
  },

  aboutPage: {
    eyebrow: "Rumicarts Hakkında",
    title: "El işçiliği. Yola dayanıklı.",
    intro:
      "Rumicarts, dünya genelinde kafeler, markalar ve etkinlik ekipleri için mobil sergi tezgahları üreten İstanbul'da küçük bir atölyedir.",
    sections: [
      {
        heading: "Neden var olduk",
        body: "Rumicarts'ı kurduk çünkü gördüğümüz hazır tezgahlar ya genel, ya zayıf, ya da bir şey ters gittiğinde konuşacak kimsenin olmadığı yüzü olmayan fabrikalardan geliyordu. Bunu farklı yapmak istedik — her tezgahı el ile yapmak, kullanacak insanlarla doğrudan konuşmak ve atölyeden çıkan her parçanın arkasında durmak.",
      },
      {
        heading: "Nasıl üretiyoruz",
        body: "Her tezgah 12mm marin kontrplakla, sağlam bir çelik şasi ve her yüzeyde rahatça yuvarlanabilen frenli tekerleklerle başlar. Paneller ilk günden senin markalama için boyutlandırılır. Kaplamalar gıdaya uygundur ve 100. kullanımda da ilk günkü kadar iyi görünmek için seçilir. Partileri küçük tutarız ki her siparişe gerçek özen gösterebilelim.",
      },
      {
        heading: "Kimlerle çalışıyoruz",
        body: "Müşterilerimiz arasında pop-up açan bağımsız kahve kavurucuları, marka aktivasyonu sahneleyen etkinlik prodüksiyon ekipleri, hafta sonu pazar tezgahçıları, lobide perakende kuran otel markaları ve fuar için cilalı bir mobil sergiye ihtiyacı olan üreticiler var. Hareket halinde bir şey satman, ikram etmen veya sergilemen gerekiyorsa — muhtemelen yapabiliriz.",
      },
      {
        heading: "Nereye kargolarız",
        body: "İstanbul'dan tezgahın gidebileceği her yere. Tezgahlar nakliye verimliliği için düz paket olarak gönderilir ve bir saatten az sürede yeniden monte edilir. Avrupa, Orta Doğu, Kuzey Amerika ve ötesine tezgah gönderdik.",
      },
      {
        heading: "Bizimle konuş",
        body: "Bilinçli olarak küçüğüz. Yani satış ekibiyle değil, üreticiyle konuşursun. İster standart bir tezgah sipariş et, ister daha önce yapmadığımız bir şey tarif et — bize mesaj at, bir iş günü içinde döneceğiz.",
      },
    ],
    cta: "Bize mesaj gönder",
  },
};
