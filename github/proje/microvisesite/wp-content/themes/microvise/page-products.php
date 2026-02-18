<?php
/* Template Name: Ürünler */
get_header(); ?>

<div class="bg-light py-5">
    <div class="container">
        <h1 class="fw-bold text-center">Ürünler – Yazar Kasa POS Cihazları</h1>
        <p class="text-center text-muted lead">İşletmenizin ihtiyaçlarına uygun, güvenilir ve yeni nesil çözümler.</p>
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb justify-content-center">
                <li class="breadcrumb-item"><a href="<?php echo home_url(); ?>">Ana Sayfa</a></li>
                <li class="breadcrumb-item active" aria-current="page">Ürünler</li>
            </ol>
        </nav>
    </div>
</div>

<section class="py-5">
    <div class="container">
        <?php if (class_exists('WooCommerce')) : ?>
            <div class="woocommerce-products-wrapper">
                <?php echo do_shortcode('[products limit="12" columns="3" paginate="true"]'); ?>
            </div>
        <?php else : ?>
            <!-- Filtreler -->
            <div class="d-flex justify-content-center flex-wrap gap-2 mb-5">
                <button class="btn btn-primary rounded-pill px-4">Tümü</button>
                <button class="btn btn-outline-secondary rounded-pill px-4">Yazar Kasa POS</button>
                <button class="btn btn-outline-secondary rounded-pill px-4">Android POS</button>
                <button class="btn btn-outline-secondary rounded-pill px-4">Pinpad</button>
                <button class="btn btn-outline-secondary rounded-pill px-4">Aksesuar</button>
            </div>

            <div class="row g-4">
                
                <!-- Ürün 1: Ingenico Move 5000F -->
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100 shadow-sm border-0 product-card hover-shadow transition-all">
                        <div class="position-relative">
                            <img src="<?php echo get_template_directory_uri(); ?>/assets/img/ingenico-move5000f.png" class="card-img-top" alt="Ingenico Move 5000F Yazar Kasa POS" style="height: 300px; object-fit: contain; padding: 20px; background: #f8f9fa;">
                            <div class="position-absolute top-0 end-0 m-3">
                                <span class="badge bg-success">Çok Satan</span>
                            </div>
                        </div>
                        <div class="card-body p-4">
                            <h5 class="card-title fw-bold text-primary">Ingenico Move 5000F</h5>
                            <p class="text-muted small mb-3">Yeni Nesil Mobil Yazar Kasa POS</p>
                            <p class="card-text text-dark small">Mobil kullanım için ideal, tüm ödeme yöntemlerini destekleyen, renkli dokunmatik ekranlı ve üstün batarya performansına sahip yazar kasa POS cihazı.</p>
                            
                            <div class="bg-light p-3 rounded mb-3">
                                <h6 class="fw-bold small mb-2">Teknik Özellikler:</h6>
                                <ul class="list-unstyled small mb-0">
                                    <li class="mb-1"><i class="fas fa-wifi text-primary me-2"></i>4G / 3G / 2G / Ethernet / WiFi</li>
                                    <li class="mb-1"><i class="fas fa-mobile-alt text-primary me-2"></i>3.5" Renkli Dokunmatik Ekran</li>
                                    <li class="mb-1"><i class="fas fa-weight-hanging text-primary me-2"></i>Hafif Tasarım (420g)</li>
                                    <li class="mb-1"><i class="fas fa-print text-primary me-2"></i>30 Satır/Sn Yazıcı Hızı</li>
                                    <li><i class="fas fa-credit-card text-primary me-2"></i>Temassız, Çip, Manyetik, QR</li>
                                </ul>
                            </div>
                            
                            <a href="https://wa.me/905488519494?text=Merhaba, Ingenico Move 5000F Yazar Kasa POS hakkında teklif almak istiyorum." class="btn btn-primary w-100 fw-bold" target="_blank"><i class="fab fa-whatsapp me-2"></i>Teklif Al</a>
                        </div>
                    </div>
                </div>

                <!-- Ürün 2: Pax A910SF -->
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100 shadow-sm border-0 product-card hover-shadow transition-all">
                        <div class="position-relative">
                            <img src="<?php echo get_template_directory_uri(); ?>/assets/img/pax-a910sf.png" class="card-img-top" alt="Pax A910SF Android Yazar Kasa POS" style="height: 300px; object-fit: contain; padding: 20px; background: #f8f9fa;">
                            <div class="position-absolute top-0 end-0 m-3">
                                <span class="badge bg-warning text-dark">Android POS</span>
                            </div>
                        </div>
                        <div class="card-body p-4">
                            <h5 class="card-title fw-bold text-primary">Pax A910SF</h5>
                            <p class="text-muted small mb-3">Android Yazar Kasa POS</p>
                            <p class="card-text text-dark small">Akıllı telefon deneyimini yazar kasa ile birleştiren, geniş ekranlı, hızlı ve güvenli Android tabanlı yeni nesil POS çözümü.</p>
                            
                            <div class="bg-light p-3 rounded mb-3">
                                <h6 class="fw-bold small mb-2">Teknik Özellikler:</h6>
                                <ul class="list-unstyled small mb-0">
                                    <li class="mb-1"><i class="fab fa-android text-success me-2"></i>Android İşletim Sistemi</li>
                                    <li class="mb-1"><i class="fas fa-tablet-alt text-primary me-2"></i>5.5" IPS Dokunmatik Ekran</li>
                                    <li class="mb-1"><i class="fas fa-camera text-primary me-2"></i>Barkod & QR Okuyucu Kamera</li>
                                    <li class="mb-1"><i class="fas fa-battery-full text-primary me-2"></i>Yüksek Kapasiteli Batarya</li>
                                    <li><i class="fas fa-network-wired text-primary me-2"></i>4G / WiFi / Bluetooth</li>
                                </ul>
                            </div>
                            
                            <a href="https://wa.me/905488519494?text=Merhaba, Pax A910SF Android POS hakkında teklif almak istiyorum." class="btn btn-primary w-100 fw-bold" target="_blank"><i class="fab fa-whatsapp me-2"></i>Teklif Al</a>
                        </div>
                    </div>
                </div>

                <!-- Ürün 3: Ingenico Move 5000F Pinpad -->
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100 shadow-sm border-0 product-card hover-shadow transition-all">
                        <div class="position-relative">
                            <img src="<?php echo get_template_directory_uri(); ?>/assets/img/ingenico-desk1600.webp" class="card-img-top" alt="Ingenico Move 5000F Pinpad" style="height: 300px; object-fit: contain; padding: 20px; background: #f8f9fa;">
                            <div class="position-absolute top-0 end-0 m-3">
                                <span class="badge bg-secondary">Aksesuar</span>
                            </div>
                        </div>
                        <div class="card-body p-4">
                            <h5 class="card-title fw-bold text-primary">Ingenico Desk/1600 Pinpad</h5>
                            <p class="text-muted small mb-3">Move 5000F Uyumlu Pinpad</p>
                            <p class="card-text text-dark small">Müşterileriniz için güvenli şifre girişi sağlayan, temassız ödeme destekli, kompakt ve ergonomik harici Pinpad cihazı.</p>
                            
                            <div class="bg-light p-3 rounded mb-3">
                                <h6 class="fw-bold small mb-2">Teknik Özellikler:</h6>
                                <ul class="list-unstyled small mb-0">
                                    <li class="mb-1"><i class="fas fa-plug text-primary me-2"></i>Move 5000F Tam Uyumlu</li>
                                    <li class="mb-1"><i class="fas fa-hand-holding-usd text-primary me-2"></i>Temassız Ödeme (NFC)</li>
                                    <li class="mb-1"><i class="fas fa-shield-alt text-primary me-2"></i>Güvenli PIN Girişi</li>
                                    <li class="mb-1"><i class="fas fa-desktop text-primary me-2"></i>Masaüstü Kullanımına Uygun</li>
                                    <li><i class="fas fa-check-circle text-primary me-2"></i>Ergonomik Tasarım</li>
                                </ul>
                            </div>
                            
                            <a href="<?php echo home_url('/iletisim'); ?>?urun=ingenico-pinpad" class="btn btn-primary w-100 fw-bold"><i class="fas fa-paper-plane me-2"></i>Teklif Al</a>
                        </div>
                    </div>
                </div>

                <!-- Ürün 4: Pax S210 Pinpad -->
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100 shadow-sm border-0 product-card hover-shadow transition-all">
                        <div class="position-relative">
                            <img src="<?php echo get_template_directory_uri(); ?>/assets/img/pax-s210.png" class="card-img-top" alt="Pax S210 Pinpad" style="height: 300px; object-fit: contain; padding: 20px; background: #f8f9fa;">
                            <div class="position-absolute top-0 end-0 m-3">
                                <span class="badge bg-secondary">Aksesuar</span>
                            </div>
                        </div>
                        <div class="card-body p-4">
                            <h5 class="card-title fw-bold text-primary">Pax S210 Pinpad</h5>
                            <p class="text-muted small mb-3">Pax A910SF Uyumlu Pinpad</p>
                            <p class="card-text text-dark small">Android POS cihazınızla entegre çalışan, şık ve güvenli pinpad çözümü. Hızlı ve güvenli ödeme deneyimi sunar.</p>
                            
                            <div class="bg-light p-3 rounded mb-3">
                                <h6 class="fw-bold small mb-2">Teknik Özellikler:</h6>
                                <ul class="list-unstyled small mb-0">
                                    <li class="mb-1"><i class="fas fa-link text-primary me-2"></i>Pax A910SF ile Entegre</li>
                                    <li class="mb-1"><i class="fas fa-wifi text-primary me-2"></i>Temassız Kart Okuma</li>
                                    <li class="mb-1"><i class="fas fa-lock text-primary me-2"></i>Yüksek Güvenlik Standartları</li>
                                    <li class="mb-1"><i class="fas fa-keyboard text-primary me-2"></i>Fiziksel Tuş Takımı</li>
                                    <li><i class="fas fa-bolt text-primary me-2"></i>Hızlı İşlem Kapasitesi</li>
                                </ul>
                            </div>
                            
                            <a href="https://wa.me/905488519494?text=Merhaba, Pax S210 Pinpad hakkında teklif almak istiyorum." class="btn btn-primary w-100 fw-bold" target="_blank"><i class="fab fa-whatsapp me-2"></i>Teklif Al</a>
                        </div>
                    </div>
                </div>

            </div>
        <?php endif; ?>
    </div>
</section>

<!-- Call to Action -->
<section class="py-5 bg-primary-custom text-white text-center">
    <div class="container">
        <h2 class="fw-bold mb-3">Hangi Cihaz Size Uygun?</h2>
        <p class="lead opacity-75 mb-4">İşletmenizin ihtiyaçlarını analiz edelim, en doğru çözümü sunalım.</p>
        <a href="https://wa.me/905488519494?text=Merhaba, işletmem için POS çözümleri hakkında danışmanlık almak istiyorum." class="btn btn-light btn-lg px-5 fw-bold text-primary" target="_blank">Ücretsiz Danışmanlık Alın</a>
    </div>
</section>

<?php get_footer(); ?>