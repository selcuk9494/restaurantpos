<?php
/* Template Name: Servis ve Destek */
get_header(); ?>

<!-- Page Header -->
<div class="bg-light py-5">
    <div class="container">
        <h1 class="fw-bold text-center">Servis ve Destek</h1>
        <p class="text-center text-muted lead">Müşteri memnuniyeti, hizmet anlayışımızın temelini oluşturmaktadır.</p>
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb justify-content-center">
                <li class="breadcrumb-item"><a href="<?php echo home_url(); ?>">Ana Sayfa</a></li>
                <li class="breadcrumb-item active" aria-current="page">Servis ve Destek</li>
            </ol>
        </nav>
    </div>
</div>

<!-- Intro & Support Services -->
<section class="py-5">
    <div class="container">
        <div class="row align-items-center mb-5">
            <div class="col-lg-6 mb-4 mb-lg-0">
                <h2 class="fw-bold text-primary-custom mb-4">Müşteri Destek Hizmetleri</h2>
                <p class="lead">Ürün ve hizmetlerimizle ilgili tüm taleplerinizde, şeffaf, hızlı ve çözüm odaklı bir destek süreci sunmayı taahhüt ediyoruz.</p>
                <p class="text-muted">Uzman destek ekibimiz, satış öncesi ve satış sonrası tüm süreçlerde sizlere profesyonel danışmanlık sağlamaktadır. Destek kapsamımız aşağıdaki hizmetleri içermektedir:</p>
                
                <ul class="list-unstyled mt-4">
                    <li class="mb-3 d-flex align-items-start">
                        <i class="fas fa-check-circle text-success mt-1 me-3"></i>
                        <span>Ürün teknik bilgileri ve kullanım yönlendirmeleri</span>
                    </li>
                    <li class="mb-3 d-flex align-items-start">
                        <i class="fas fa-check-circle text-success mt-1 me-3"></i>
                        <span>Sipariş, teslimat ve kargo süreçleri</span>
                    </li>
                    <li class="mb-3 d-flex align-items-start">
                        <i class="fas fa-check-circle text-success mt-1 me-3"></i>
                        <span>Garanti kapsamı ve iade prosedürleri</span>
                    </li>
                    <li class="mb-3 d-flex align-items-start">
                        <i class="fas fa-check-circle text-success mt-1 me-3"></i>
                        <span>Arıza bildirimleri ve servis talepleri</span>
                    </li>
                    <li class="mb-3 d-flex align-items-start">
                        <i class="fas fa-check-circle text-success mt-1 me-3"></i>
                        <span>Yedek parça ve aksesuar başvuruları</span>
                    </li>
                </ul>
            </div>
            <div class="col-lg-6">
                <img src="<?php echo get_template_directory_uri(); ?>/assets/img/servis-destek.png" alt="Müşteri Destek" class="img-fluid rounded shadow">
            </div>
        </div>
    </div>
</section>

<!-- Technical Service Process -->
<section class="py-5 bg-light">
    <div class="container">
        <div class="text-center mb-5">
            <h2 class="fw-bold">Teknik Servis Süreci</h2>
            <p class="text-muted">Ürünleriniz, yetkili servislerimiz tarafından kalite standartlarımıza uygun şekilde değerlendirilir ve onarılır.</p>
        </div>
        
        <div class="row g-4 text-center">
            <div class="col-md-3">
                <div class="bg-white p-4 rounded shadow-sm h-100 position-relative">
                    <div class="bg-primary-custom text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 60px; height: 60px; font-size: 1.5rem;">1</div>
                    <h5 class="fw-bold">İletişim</h5>
                    <p class="small text-muted mb-0">Müşteri destek birimimiz ile iletişime geçilmesi.</p>
                </div>
            </div>
            <div class="col-md-3">
                <div class="bg-white p-4 rounded shadow-sm h-100 position-relative">
                    <div class="bg-primary-custom text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 60px; height: 60px; font-size: 1.5rem;">2</div>
                    <h5 class="fw-bold">Kayıt</h5>
                    <p class="small text-muted mb-0">Servis kaydının oluşturulması.</p>
                </div>
            </div>
            <div class="col-md-3">
                <div class="bg-white p-4 rounded shadow-sm h-100 position-relative">
                    <div class="bg-primary-custom text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 60px; height: 60px; font-size: 1.5rem;">3</div>
                    <h5 class="fw-bold">Yönlendirme</h5>
                    <p class="small text-muted mb-0">En yakın yetkili servis yönlendirmesinin yapılması.</p>
                </div>
            </div>
            <div class="col-md-3">
                <div class="bg-white p-4 rounded shadow-sm h-100 position-relative">
                    <div class="bg-primary-custom text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 60px; height: 60px; font-size: 1.5rem;">4</div>
                    <h5 class="fw-bold">Onarım</h5>
                    <p class="small text-muted mb-0">Onarım süreci ve bilgilendirme aşamasının başlatılması.</p>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Warranty & FAQ -->
<section class="py-5">
    <div class="container">
        <div class="row g-5">
            <div class="col-lg-6">
                <h3 class="fw-bold mb-4"><i class="fas fa-shield-alt text-primary me-2"></i>Garanti ve İade Politikası</h3>
                <p class="text-muted">Tüm ürünlerimiz, yürürlükteki mevzuat ve firma politikalarımız kapsamında garanti altındadır. Garanti koşulları, iade ve değişim süreçleri hakkında detaylı bilgi almak için müşteri destek birimimiz ile iletişime geçebilirsiniz.</p>
                
                <div class="alert alert-info border-0 shadow-sm mt-4">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>Kalite ve Güvence:</strong> Sunmuş olduğumuz tüm hizmetlerde, sürdürülebilir kalite anlayışı ve müşteri odaklı hizmet standartlarını esas almaktayız. Geri bildirimleriniz, hizmet kalitemizin sürekli geliştirilmesine katkı sağlamaktadır.
                </div>
            </div>
            
            <div class="col-lg-6">
                <h3 class="fw-bold mb-4"><i class="fas fa-question-circle text-primary me-2"></i>Sıkça Sorulan Sorular</h3>
                <div class="accordion" id="faqAccordion">
                    <div class="accordion-item border-0 shadow-sm mb-3">
                        <h2 class="accordion-header" id="headingOne">
                            <button class="accordion-button collapsed fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="false" aria-controls="collapseOne">
                                Garanti süresi ne kadar?
                            </button>
                        </h2>
                        <div id="collapseOne" class="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent="#faqAccordion">
                            <div class="accordion-body text-muted small">
                                Tüm yazar kasa POS cihazlarımız 1 yıl resmi garanti kapsamındadır.
                            </div>
                        </div>
                    </div>
                    <div class="accordion-item border-0 shadow-sm mb-3">
                        <h2 class="accordion-header" id="headingTwo">
                            <button class="accordion-button collapsed fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                                Arıza durumunda ne yapmalıyım?
                            </button>
                        </h2>
                        <div id="collapseTwo" class="accordion-collapse collapse" aria-labelledby="headingTwo" data-bs-parent="#faqAccordion">
                            <div class="accordion-body text-muted small">
                                0542 851 9494 numaralı destek hattımızı arayarak arıza kaydı oluşturabilirsiniz.
                            </div>
                        </div>
                    </div>
                    <div class="accordion-item border-0 shadow-sm mb-3">
                        <h2 class="accordion-header" id="headingThree">
                            <button class="accordion-button collapsed fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                                Kurulum ücretli mi?
                            </button>
                        </h2>
                        <div id="collapseThree" class="accordion-collapse collapse" aria-labelledby="headingThree" data-bs-parent="#faqAccordion">
                            <div class="accordion-body text-muted small">
                                İlk kurulum ve eğitim hizmetlerimiz ücretsiz olarak sunulmaktadır.
                            </div>
                        </div>
                    </div>
                </div>
                <p class="mt-3 text-muted small">İlave sorularınız için destek ekibimiz hizmetinizdedir.</p>
            </div>
        </div>
    </div>
</section>

<!-- Contact Info Bar -->
<section class="bg-primary-custom text-white py-5">
    <div class="container text-center">
        <h3 class="fw-bold mb-4">Bizimle İletişime Geçin</h3>
        <div class="row justify-content-center g-4">
            <div class="col-md-4">
                <div class="border border-light rounded p-3">
                    <i class="fas fa-envelope fa-2x mb-2"></i>
                    <p class="mb-0">info@microvise.net</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="border border-light rounded p-3">
                    <i class="fas fa-phone-alt fa-2x mb-2"></i>
                    <p class="mb-0">0542 851 9494</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="border border-light rounded p-3">
                    <i class="fas fa-clock fa-2x mb-2"></i>
                    <p class="mb-0">Hafta içi 09:00 – 18:00</p>
                </div>
            </div>
        </div>
    </div>
</section>

<?php get_footer(); ?>
