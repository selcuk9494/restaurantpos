<?php get_header(); ?>

<!-- Hero Section -->
<section class="hero-section text-center text-lg-start d-flex align-items-center">
    <div class="container">
        <div class="row align-items-center">
            <div class="col-lg-6 mb-5 mb-lg-0">
                <h1 class="display-4 fw-bold mb-4">KKTC'nin Güvenilir Yazar Kasa POS Çözümleri</h1>
                <p class="lead mb-4 text-light opacity-75">Girne, Lefkoşa, Mağusa ve tüm bölgelerde işletmeniz için hızlı ödeme, kolay kullanım ve güçlü destek.</p>
                <div class="d-flex gap-3 justify-content-center justify-content-lg-start flex-wrap">
                    <a href="<?php echo home_url('/urunler'); ?>" class="btn btn-outline-light-custom btn-lg">Ürünleri İncele</a>
                    <a href="<?php echo home_url('/entegrasyon-uyumlu-yazilimlar'); ?>" class="btn btn-outline-light-custom btn-lg">Entegratörler</a>
                    <a href="<?php echo home_url('/referanslar'); ?>" class="btn btn-outline-light-custom btn-lg">Referanslar</a>
                </div>
                <div class="mt-5 d-flex gap-4 flex-wrap justify-content-center justify-content-lg-start">
                    <div class="d-flex align-items-center text-light">
                        <i class="fas fa-check-circle me-2 text-warning"></i> Hızlı Kurulum
                    </div>
                    <div class="d-flex align-items-center text-light">
                        <i class="fas fa-headset me-2 text-warning"></i> Teknik Destek
                    </div>
                    <div class="d-flex align-items-center text-light">
                        <i class="fas fa-shield-alt me-2 text-warning"></i> Güvenli Ödeme
                    </div>
                </div>
            </div>
            <div class="col-lg-6 text-center position-relative">
                <div class="d-flex justify-content-center align-items-center">
                    <img src="<?php echo get_template_directory_uri(); ?>/assets/img/slayt.png" alt="Microvise POS Çözümleri" class="img-fluid" style="max-height: 600px; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.15));">
                </div>
                
                <div class="d-flex justify-content-center align-items-center gap-4 mt-2">
                    <img src="<?php echo get_template_directory_uri(); ?>/assets/img/ingenicologo.png" alt="Ingenico" class="img-fluid" style="max-height: 40px; opacity: 0.9;">
                    <img src="<?php echo get_template_directory_uri(); ?>/assets/img/paxlogo.png" alt="PAX" class="img-fluid" style="max-height: 40px; opacity: 0.9;">
                    <img src="<?php echo get_template_directory_uri(); ?>/assets/img/Worldlinelogo.png" alt="Worldline" class="img-fluid" style="max-height: 80px; opacity: 0.9;">
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Bankalar Section -->
<section class="py-5">
    <div class="container">
        <div class="text-center mb-4">
            <h3 class="fw-bold">Desteklenen Bankalar</h3>
        </div>
        <div class="d-flex justify-content-center align-items-center flex-wrap gap-5">
             <img src="<?php echo get_template_directory_uri(); ?>/assets/img/kooplogo.png" alt="Koopbank" class="img-fluid" style="max-height: 85px; transition: all 0.3s;">
             <img src="<?php echo get_template_directory_uri(); ?>/assets/img/halklogo.png" alt="Halkbank" class="img-fluid" style="max-height: 85px; transition: all 0.3s;">
             <img src="<?php echo get_template_directory_uri(); ?>/assets/img/garantilogo.png" alt="Garanti BBVA" class="img-fluid" style="max-height: 85px; transition: all 0.3s;">
             <img src="<?php echo get_template_directory_uri(); ?>/assets/img/teblogo.png" alt="TEB" class="img-fluid" style="max-height: 85px; transition: all 0.3s;">
             <img src="<?php echo get_template_directory_uri(); ?>/assets/img/islogo.png" alt="İş Bankası" class="img-fluid" style="max-height: 85px; transition: all 0.3s;">
             <img src="<?php echo get_template_directory_uri(); ?>/assets/img/ziraatlogo.png" alt="Ziraat Bankası" class="img-fluid" style="max-height: 85px; transition: all 0.3s;">
             <img src="<?php echo get_template_directory_uri(); ?>/assets/img/denizlogo.png" alt="Denizbank" class="img-fluid" style="max-height: 85px; transition: all 0.3s;">
        </div>
        <style>
            .d-flex img:hover {
                transform: scale(1.1);
            }
        </style>
    </div>
</section>

<!-- Avantajlar Section -->
<section class="py-5 bg-light">
    <div class="container">
        <div class="text-center mb-5">
            <h2 class="fw-bold">Neden Microvise?</h2>
            <p class="text-muted">İşletmenizi bir adım öne taşıyan özellikler</p>
        </div>
        <div class="row g-4">
            <div class="col-md-3">
                <div class="feature-card text-center">
                    <i class="fas fa-store feature-icon"></i>
                    <h5>İşletmenize Uygun</h5>
                    <p class="text-muted small">Market, kafe, restoran ve mağazalar için optimize edilmiş çözümler.</p>
                </div>
            </div>
            <div class="col-md-3">
                <div class="feature-card text-center">
                    <i class="fas fa-bolt feature-icon"></i>
                    <h5>Kolay Kullanım</h5>
                    <p class="text-muted small">Hızlı işlem, pratik arayüz ve sade operasyon ile zaman kazanın.</p>
                </div>
            </div>
            <div class="col-md-3">
                <div class="feature-card text-center">
                    <i class="fas fa-tools feature-icon"></i>
                    <h5>Satış Sonrası Destek</h5>
                    <p class="text-muted small">Kurulum, eğitim ve teknik destek ile her zaman yanınızdayız.</p>
                </div>
            </div>
            <div class="col-md-3">
                <div class="feature-card text-center">
                    <i class="fas fa-infinity feature-icon"></i>
                    <h5>Güven ve Süreklilik</h5>
                    <p class="text-muted small">İş akışınızı aksatmayacak sağlam ve dayanıklı donanımlar.</p>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Ürünler Özeti Section -->
<section class="py-5">
    <div class="container">
        <div class="row align-items-center mb-5">
            <div class="col-md-8 text-center text-md-start">
                <h2 class="fw-bold">Yazar Kasa POS Cihazları</h2>
                <p class="text-muted mb-0">İhtiyacınıza göre farklı model seçenekleriyle, ödeme süreçlerinizi modernleştirin.</p>
            </div>
            <div class="col-md-4 text-center text-md-end mt-3 mt-md-0">
                <a href="<?php echo home_url('/urunler'); ?>" class="btn btn-outline-primary">Tüm Ürünleri Gör <i class="fas fa-arrow-right ms-2"></i></a>
            </div>
        </div>

        <div class="row g-4">
            <!-- Ürün 1: Ingenico Move 5000F -->
            <div class="col-md-6 col-lg-3">
                <div class="product-card h-100 bg-white shadow-sm border-0 rounded overflow-hidden">
                    <div class="product-img p-4 text-center bg-light">
                        <img src="<?php echo get_template_directory_uri(); ?>/assets/img/ingenico-move5000f.png" alt="Ingenico Move 5000F" class="img-fluid" style="max-height: 200px; object-fit: contain;">
                    </div>
                    <div class="p-4 text-center">
                        <h5 class="fw-bold mb-2">Ingenico Move 5000F</h5>
                        <p class="text-muted small mb-3">Yeni Nesil Mobil Yazar Kasa POS</p>
                        <a href="<?php echo home_url('/iletisim'); ?>?urun=ingenico-move-5000f" class="btn btn-sm btn-outline-primary w-100">Teklif Al</a>
                    </div>
                </div>
            </div>

            <!-- Ürün 2: PAX A910SF -->
            <div class="col-md-6 col-lg-3">
                <div class="product-card h-100 bg-white shadow-sm border-0 rounded overflow-hidden">
                    <div class="product-img p-4 text-center bg-light">
                        <img src="<?php echo get_template_directory_uri(); ?>/assets/img/pax-a910sf.png" alt="PAX A910SF" class="img-fluid" style="max-height: 200px; object-fit: contain;">
                    </div>
                    <div class="p-4 text-center">
                        <h5 class="fw-bold mb-2">PAX A910SF</h5>
                        <p class="text-muted small mb-3">Android Yazar Kasa POS</p>
                        <a href="<?php echo home_url('/iletisim'); ?>?urun=pax-a910sf" class="btn btn-sm btn-outline-primary w-100">Teklif Al</a>
                    </div>
                </div>
            </div>

            <!-- Ürün 3: Ingenico Desk/1600 -->
            <div class="col-md-6 col-lg-3">
                <div class="product-card h-100 bg-white shadow-sm border-0 rounded overflow-hidden">
                    <div class="product-img p-4 text-center bg-light">
                        <img src="<?php echo get_template_directory_uri(); ?>/assets/img/ingenico-desk1600.png" alt="Ingenico Desk/1600" class="img-fluid" style="max-height: 200px; object-fit: contain;">
                    </div>
                    <div class="p-4 text-center">
                        <h5 class="fw-bold mb-2">Ingenico Desk/1600</h5>
                        <p class="text-muted small mb-3">Temassız Pinpad</p>
                        <a href="<?php echo home_url('/iletisim'); ?>?urun=ingenico-desk1600" class="btn btn-sm btn-outline-primary w-100">Teklif Al</a>
                    </div>
                </div>
            </div>

            <!-- Ürün 4: PAX S210 -->
            <div class="col-md-6 col-lg-3">
                <div class="product-card h-100 bg-white shadow-sm border-0 rounded overflow-hidden">
                    <div class="product-img p-4 text-center bg-light">
                        <img src="<?php echo get_template_directory_uri(); ?>/assets/img/pax-s210.png" alt="PAX S210" class="img-fluid" style="max-height: 200px; object-fit: contain;">
                    </div>
                    <div class="p-4 text-center">
                        <h5 class="fw-bold mb-2">PAX S210</h5>
                        <p class="text-muted small mb-3">Kompakt Pinpad</p>
                        <a href="<?php echo home_url('/iletisim'); ?>?urun=pax-s210" class="btn btn-sm btn-outline-primary w-100">Teklif Al</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Sektörel Çözümler -->
<section class="py-5 bg-primary-custom text-white">
    <div class="container">
        <div class="text-center mb-5">
            <h2 class="text-white fw-bold">Sektörünüze Uygun Çözümler</h2>
            <p class="opacity-75">İşletme tipinize göre doğru cihaz seçimi ve kurulum desteğiyle yanınızdayız.</p>
        </div>
        <div class="row g-4 text-center">
            <div class="col-6 col-md-3">
                <div class="p-3 border border-light rounded hover-bg-light transition-all">
                    <i class="fas fa-shopping-basket fa-3x mb-3"></i>
                    <h5>Market & Şarküteri</h5>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="p-3 border border-light rounded hover-bg-light transition-all">
                    <i class="fas fa-utensils fa-3x mb-3"></i>
                    <h5>Kafe & Restoran</h5>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="p-3 border border-light rounded hover-bg-light transition-all">
                    <i class="fas fa-tshirt fa-3x mb-3"></i>
                    <h5>Perakende Mağaza</h5>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="p-3 border border-light rounded hover-bg-light transition-all">
                    <i class="fas fa-concierge-bell fa-3x mb-3"></i>
                    <h5>Hızlı Satış</h5>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- CTA Section -->
<section class="py-5">
    <div class="container">
        <div class="bg-light rounded-3 p-5 text-center border">
            <h2 class="fw-bold mb-3">Size en uygun POS çözümünü birlikte seçelim</h2>
            <p class="lead text-muted mb-4">İhtiyacınızı 1 dakikada anlatın, en uygun cihaz önerisini ve fiyat teklifini iletelim.</p>
            <div class="d-flex gap-3 justify-content-center flex-wrap">
                <a href="https://wa.me/905488519494" class="btn btn-primary btn-lg" target="_blank"><i class="fab fa-whatsapp me-2"></i> Hemen Ara: 0548 851 9494</a>
                <a href="<?php echo home_url('/iletisim'); ?>" class="btn btn-outline-dark btn-lg">Teklif İste</a>
            </div>
        </div>
    </div>
</section>

<!-- SEO Bölgesel Hizmetler Section -->
<section class="py-5 bg-white border-top">
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-lg-10 text-center">
                <h2 class="fw-bold mb-4">KKTC Genelinde Yazar Kasa POS Hizmet Noktalarımız</h2>
                <p class="text-muted lead mb-5">Microvise Innovation olarak, Kuzey Kıbrıs Türk Cumhuriyeti'nin tüm bölgelerinde işletmelere özel yeni nesil ödeme sistemleri çözümleri sunuyoruz.</p>
                
                <div class="row g-4 text-start">
                    <div class="col-md-4">
                        <h4 class="h5 fw-bold text-primary"><i class="fas fa-map-marker-alt me-2"></i>Lefkoşa Bölgesi</h4>
                        <p class="small text-muted">Lefkoşa merkez, Gönyeli, Hamitköy ve çevre bölgelerde yazar kasa POS satışı, kurulumu ve yerinde teknik servis hizmetimizle işletmenizin yanındayız.</p>
                    </div>
                    <div class="col-md-4">
                        <h4 class="h5 fw-bold text-primary"><i class="fas fa-map-marker-alt me-2"></i>Girne Bölgesi</h4>
                        <p class="small text-muted">Girne merkez, Alsancak, Çatalköy, Lapta ve tüm sahil şeridindeki turizm ve perakende işletmeleri için hızlı ve güvenilir POS çözümleri sağlıyoruz.</p>
                    </div>
                    <div class="col-md-4">
                        <h4 class="h5 fw-bold text-primary"><i class="fas fa-map-marker-alt me-2"></i>Gazimağusa Bölgesi</h4>
                        <p class="small text-muted">Gazimağusa suriçi ve yeni yerleşim bölgelerindeki kafe, restoran ve marketler için Ingenico ve PAX marka yazar kasa cihazları temin ediyoruz.</p>
                    </div>
                    <div class="col-md-6">
                        <h4 class="h5 fw-bold text-primary"><i class="fas fa-map-marker-alt me-2"></i>Güzelyurt ve Lefke</h4>
                        <p class="small text-muted">Batı bölgelerimizdeki işletmelerin dijital dönüşümüne katkı sağlıyor, Güzelyurt ve Lefke bölgesine düzenli servis ağımızla kesintisiz destek sunuyoruz.</p>
                    </div>
                    <div class="col-md-6">
                        <h4 class="h5 fw-bold text-primary"><i class="fas fa-map-marker-alt me-2"></i>İskele ve Karpaz</h4>
                        <p class="small text-muted">Hızla gelişen İskele Long Beach bölgesi ve Karpaz yarımadasındaki işletmeler için modern ödeme kaydedici cihaz çözümleri Microvise güvencesiyle.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<?php get_footer(); ?>
