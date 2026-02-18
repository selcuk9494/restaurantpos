<?php
/* Template Name: Hakkımızda */
get_header(); ?>

<!-- Page Header -->
<div class="bg-light py-5">
    <div class="container">
        <h1 class="fw-bold text-center">Hakkımızda</h1>
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb justify-content-center">
                <li class="breadcrumb-item"><a href="<?php echo home_url(); ?>">Ana Sayfa</a></li>
                <li class="breadcrumb-item active" aria-current="page">Hakkımızda</li>
            </ol>
        </nav>
    </div>
</div>

<!-- Main Content -->
<section class="py-5">
    <div class="container">
        <div class="row align-items-center">
            <div class="col-lg-6 mb-4 mb-lg-0">
                <div class="position-relative">
                    <img src="<?php echo get_template_directory_uri(); ?>/assets/img/hakkimizda.png" alt="Microvise Innovation" class="img-fluid rounded-3 shadow-lg">
                    <div class="position-absolute bottom-0 start-0 bg-primary-custom text-white p-4 rounded-end shadow d-none d-md-block" style="max-width: 300px;">
                        <p class="mb-0 fw-bold">"İşletmenizin teknoloji ve satış çözüm ortağı."</p>
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <h2 class="fw-bold mb-4 text-primary-custom">Microvise Innovation Ltd.</h2>
                <p class="lead text-dark">Microvise Innovation Ltd. olarak işletmelerin satış ve ödeme süreçlerini daha hızlı, güvenli ve verimli hale getiren yazar kasa POS çözümleri sunuyoruz.</p>
                <p class="text-muted">Lefkoşa merkezli firmamız, farklı sektörlerde faaliyet gösteren işletmelere uygun, modern ve sürdürülebilir ödeme sistemleriyle değer katmayı hedefler.</p>
                <p class="text-muted">Kurulduğumuz günden bu yana odağımız; doğru cihaz seçimi, sorunsuz kurulum ve güçlü satış sonrası destek sunarak müşterilerimizin operasyonlarını kesintisiz şekilde sürdürebilmesini sağlamaktır. Her işletmenin ihtiyacının farklı olduğunun bilinciyle, standart çözümler yerine işletmeye özel POS önerileri geliştiriyoruz.</p>
                <p class="text-muted">Microvise Innovation, marketlerden kafelere, restoranlardan perakende mağazalara kadar geniş bir yelpazede hizmet verir. Sunduğumuz çözümler; sadece bir cihaz satışı değil, aynı zamanda iş süreçlerini kolaylaştıran bir teknoloji ortaklığıdır. Amacımız, işletmelerin ödeme altyapısını modernleştirerek müşteri deneyimini ve satış performansını artırmaktır.</p>
            </div>
        </div>
    </div>
</section>

<!-- Mission & Vision -->
<section class="py-5 bg-light">
    <div class="container">
        <div class="row g-4">
            <div class="col-md-6">
                <div class="bg-white p-5 rounded-3 shadow-sm h-100 border-start border-5 border-primary">
                    <div class="d-flex align-items-center mb-3">
                        <div class="bg-primary-custom text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 50px; height: 50px;">
                            <i class="fas fa-bullseye fa-lg"></i>
                        </div>
                        <h3 class="fw-bold mb-0">Misyonumuz</h3>
                    </div>
                    <p class="text-muted mb-0">İşletmelere güvenilir, hızlı ve kullanıcı dostu POS çözümleri sunarak, satış süreçlerini kolaylaştırmak ve uzun vadeli iş ortaklıkları kurmak.</p>
                </div>
            </div>
            <div class="col-md-6">
                <div class="bg-white p-5 rounded-3 shadow-sm h-100 border-start border-5 border-warning">
                    <div class="d-flex align-items-center mb-3">
                        <div class="bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 50px; height: 50px;">
                            <i class="fas fa-eye fa-lg"></i>
                        </div>
                        <h3 class="fw-bold mb-0">Vizyonumuz</h3>
                    </div>
                    <p class="text-muted mb-0">Ödeme sistemleri alanında Kuzey Kıbrıs’ta ve bölgede güvenilir, yenilikçi ve tercih edilen teknoloji sağlayıcısı olmak.</p>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Values -->
<section class="py-5">
    <div class="container">
        <div class="text-center mb-5">
            <h2 class="fw-bold">Değerlerimiz</h2>
            <p class="text-muted">Bizi biz yapan temel prensiplerimiz</p>
        </div>
        <div class="row g-4">
            <div class="col-md-6 col-lg-3">
                <div class="text-center p-4 h-100 hover-bg-light transition-all rounded">
                    <i class="fas fa-handshake fa-3x text-primary mb-3"></i>
                    <h5 class="fw-bold">Güven</h5>
                    <p class="text-muted small">Şeffaf iletişim ve sürdürülebilir iş ilişkileri.</p>
                </div>
            </div>
            <div class="col-md-6 col-lg-3">
                <div class="text-center p-4 h-100 hover-bg-light transition-all rounded">
                    <i class="fas fa-users fa-3x text-primary mb-3"></i>
                    <h5 class="fw-bold">Müşteri Odaklılık</h5>
                    <p class="text-muted small">İhtiyaca özel çözümler ve hızlı geri dönüş.</p>
                </div>
            </div>
            <div class="col-md-6 col-lg-3">
                <div class="text-center p-4 h-100 hover-bg-light transition-all rounded">
                    <i class="fas fa-star fa-3x text-primary mb-3"></i>
                    <h5 class="fw-bold">Kalite</h5>
                    <p class="text-muted small">Dayanıklı ürünler ve profesyonel hizmet anlayışı.</p>
                </div>
            </div>
            <div class="col-md-6 col-lg-3">
                <div class="text-center p-4 h-100 hover-bg-light transition-all rounded">
                    <i class="fas fa-sync-alt fa-3x text-primary mb-3"></i>
                    <h5 class="fw-bold">Süreklilik</h5>
                    <p class="text-muted small">Satış sonrası destek ve uzun vadeli çözüm ortaklığı.</p>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Why Us -->
<section class="py-5 bg-primary-custom text-white">
    <div class="container">
        <div class="row align-items-center">
            <div class="col-lg-5 mb-4 mb-lg-0">
                <h2 class="fw-bold mb-4">Neden Microvise?</h2>
                <p class="opacity-75 lead">İşletmenizi geleceğe taşıyacak çözümler sunuyoruz.</p>
                <a href="https://wa.me/905488519494?text=Merhaba, hizmetleriniz hakkında bilgi almak istiyorum." class="btn btn-light btn-lg mt-3 fw-bold text-primary" target="_blank">Bizimle Tanışın</a>
            </div>
            <div class="col-lg-7">
                <div class="row g-4">
                    <div class="col-sm-6">
                        <div class="d-flex bg-white bg-opacity-10 p-3 rounded">
                            <i class="fas fa-check-circle text-warning fa-2x me-3"></i>
                            <div>
                                <h5 class="fw-bold mb-1">Doğru Öneri</h5>
                                <p class="mb-0 small opacity-75">İşletmenize en uygun cihaz seçimi.</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-sm-6">
                        <div class="d-flex bg-white bg-opacity-10 p-3 rounded">
                            <i class="fas fa-rocket text-warning fa-2x me-3"></i>
                            <div>
                                <h5 class="fw-bold mb-1">Hızlı Kurulum</h5>
                                <p class="mb-0 small opacity-75">Kullanım desteği ve hızlı aktivasyon.</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-sm-6">
                        <div class="d-flex bg-white bg-opacity-10 p-3 rounded">
                            <i class="fas fa-headset text-warning fa-2x me-3"></i>
                            <div>
                                <h5 class="fw-bold mb-1">Teknik Destek</h5>
                                <p class="mb-0 small opacity-75">Güçlü altyapı ve uzman ekip.</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-sm-6">
                        <div class="d-flex bg-white bg-opacity-10 p-3 rounded">
                            <i class="fas fa-comments text-warning fa-2x me-3"></i>
                            <div>
                                <h5 class="fw-bold mb-1">İletişim</h5>
                                <p class="mb-0 small opacity-75">Satış sonrası kesintisiz destek.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<?php get_footer(); ?>
