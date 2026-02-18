<?php if ( ! ( function_exists('is_checkout') && is_checkout() && !empty( is_wc_endpoint_url('order-received') ) ) ) : ?>
<footer class="bg-dark text-light pt-5 pb-3 mt-auto">
    <div class="container">
        <div class="row">
            <!-- Marka Bilgileri -->
            <div class="col-md-3 mb-4">
                <h4 class="mb-3">Microvise Innovation</h4>
                <p>İşletmenizin ihtiyaçlarına uygun, güvenilir ve modern ödeme sistemleri çözümleri.</p>
                <div class="contact-info mt-3">
                    <p><i class="fas fa-map-marker-alt me-2"></i> Atatürk Cad Emek2 No:1 Yenişehir Lefkoşa KKTC</p>
                    <p><i class="fas fa-phone me-2"></i> <a href="tel:+905428519494" class="text-light">0542 851 9494</a></p>
                    <p><i class="fas fa-envelope me-2"></i> <a href="mailto:info@microvise.net" class="text-light">info@microvise.net</a></p>
                </div>
            </div>

            <!-- Hızlı Linkler -->
            <div class="col-md-3 mb-4">
                <h4 class="mb-3">Hızlı Erişim</h4>
                <ul class="list-unstyled">
                    <li><a href="<?php echo home_url('/urunler'); ?>" class="text-light text-decoration-none">Ürünler</a></li>
                    <li><a href="<?php echo home_url('/servis-destek'); ?>" class="text-light text-decoration-none">Servis & Destek</a></li>
                    <li><a href="<?php echo home_url('/hakkimizda'); ?>" class="text-light text-decoration-none">Hakkımızda</a></li>
                    <li><a href="<?php echo home_url('/iletisim'); ?>" class="text-light text-decoration-none">İletişim</a></li>
                </ul>
            </div>

            <!-- Çalışma Saatleri & Sosyal Medya -->
            <div class="col-md-3 mb-4">
                <h4 class="mb-3">Bizi Takip Edin</h4>
                <div class="social-icons mb-4">
                    <a href="#" class="text-light me-3 fs-4"><i class="fab fa-facebook"></i></a>
                    <a href="#" class="text-light me-3 fs-4"><i class="fab fa-instagram"></i></a>
                    <a href="#" class="text-light me-3 fs-4"><i class="fab fa-linkedin"></i></a>
                </div>
                <div class="ssl-badge">
                    <i class="fas fa-lock me-2 text-success"></i> <small>SSL Korumalı Güvenli Bağlantı</small>
                </div>
            </div>

            <!-- Yasal Bilgilendirme -->
            <div class="col-md-3 mb-4">
                <h4 class="mb-3">Yasal Bilgilendirme</h4>
                <ul class="list-unstyled">
                    <li class="mb-2"><a href="#" class="text-light text-decoration-none" data-bs-toggle="modal" data-bs-target="#termsModalGlobal"><i class="fas fa-file-contract me-2"></i>Kullanım Sözleşmesi</a></li>
                    <li class="mb-2"><a href="#" class="text-light text-decoration-none" data-bs-toggle="modal" data-bs-target="#privacyModalGlobal"><i class="fas fa-user-shield me-2"></i>Gizlilik Politikası</a></li>
                    <li class="mb-2"><a href="#" class="text-light text-decoration-none" data-bs-toggle="modal" data-bs-target="#cookieModalGlobal"><i class="fas fa-cookie-bite me-2"></i>Çerez Politikası</a></li>
                    <li class="mb-2"><a href="#" class="text-light text-decoration-none" data-bs-toggle="modal" data-bs-target="#refundModalGlobal"><i class="fas fa-undo me-2"></i>İade Politikası</a></li>
                    <li class="mb-2"><a href="#" class="text-light text-decoration-none" data-bs-toggle="modal" data-bs-target="#consentModalGlobal"><i class="fas fa-file-signature me-2"></i>Aydınlatma ve Rıza Metni</a></li>
                </ul>
            </div>
        </div>

        <hr class="bg-secondary my-4">

        <div class="row align-items-center">
            <div class="col-md-6 text-center text-md-start">
                <p class="mb-0 small">&copy; <?php echo date('Y'); ?> Microvise Innovation Ltd. Tüm Hakları Saklıdır.</p>
            </div>
            <div class="col-md-6 text-center text-md-end">
                <a href="https://wa.me/905488519494" class="btn btn-success rounded-pill btn-sm" target="_blank">
                    <i class="fab fa-whatsapp me-1"></i> WhatsApp Destek
                </a>
            </div>
        </div>
    </div>
</footer>

<!-- Global Terms Modal -->
<div class="modal fade" id="termsModalGlobal" tabindex="-1" aria-labelledby="termsModalGlobalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="termsModalGlobalLabel">KULLANIM SÖZLEŞMESİ</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p>İşbu Kullanım Sözleşmesi (“Sözleşme”), Microvise (“Şirket”) tarafından işletilen internet sitesi ve/veya dijital platformları kullanan tüm kullanıcılar (“Kullanıcı”) için geçerlidir.</p>
                <p>Siteye erişim sağlayan veya siteyi kullanan her kullanıcı, işbu Sözleşme hükümlerini okuduğunu, anladığını ve kabul ettiğini beyan eder.</p>

                <h6>1. Taraflar</h6>
                <p>Bu Sözleşme;</p>
                <p><strong>Microvise</strong><br>
                Adres: Atatürk Cad. Emek 2 No:1 Yenişehir, Lefkoşa<br>
                E-posta: info@microvise.net<br>
                Telefon: 0548 851 9494</p>
                <p>ile siteyi kullanan gerçek veya tüzel kişi arasında akdedilmiştir.</p>

                <h6>2. Sözleşmenin Konusu</h6>
                <p>İşbu Sözleşme; Microvise’e ait internet sitesi ve dijital platformların kullanımına ilişkin şartları, tarafların hak ve yükümlülüklerini düzenlemektedir.</p>

                <h6>3. Kullanım Koşulları</h6>
                <p>Kullanıcı;</p>
                <ul class="list-unstyled ps-3">
                    <li><i class="fas fa-check me-2 text-success"></i>Siteyi yalnızca hukuka uygun amaçlarla kullanacağını,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Yanıltıcı, hatalı veya üçüncü kişilerin haklarını ihlal eden içerik oluşturmayacağını,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Site altyapısına zarar verecek herhangi bir girişimde bulunmayacağını,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Yetkisiz erişim, veri toplama veya sistem güvenliğini ihlal edici faaliyetlerde bulunmayacağını</li>
                </ul>
                <p>kabul ve taahhüt eder.</p>

                <h6>4. Fikri Mülkiyet Hakları</h6>
                <p>Site kapsamında yer alan tüm içerikler; metinler, görseller, logolar, grafikler, yazılımlar ve tasarımlar dahil olmak üzere Microvise’e aittir veya lisanslı olarak kullanılmaktadır.</p>
                <p>Bu içerikler; önceden yazılı izin alınmaksızın kopyalanamaz, çoğaltılamaz, yayımlanamaz, değiştirilemez veya ticari amaçla kullanılamaz.</p>

                <h6>5. Hizmetlerde Değişiklik ve Kesinti</h6>
                <p>Microvise;</p>
                <ul class="list-unstyled ps-3">
                    <li><i class="fas fa-check me-2 text-success"></i>Site içeriğini ve sunulan hizmetleri dilediği zaman değiştirme,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Siteye erişimi geçici veya kalıcı olarak durdurma</li>
                </ul>
                <p>hakkını saklı tutar. Bu durumdan dolayı kullanıcıya karşı herhangi bir sorumluluk doğmaz.</p>

                <h6>6. Sorumluluğun Sınırlandırılması</h6>
                <p>Microvise;</p>
                <ul class="list-unstyled ps-3">
                    <li><i class="fas fa-check me-2 text-success"></i>Sitenin kesintisiz veya hatasız çalışacağını garanti etmez,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Teknik arızalar, bakım çalışmaları veya mücbir sebeplerden doğan kesintilerden sorumlu tutulamaz,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Kullanıcının siteyi kullanması nedeniyle doğabilecek dolaylı veya doğrudan zararlardan sorumlu değildir.</li>
                </ul>
                <p>Kullanıcı, siteyi “olduğu gibi” kabul eder.</p>

                <h6>7. Üçüncü Taraf Bağlantıları</h6>
                <p>Site, üçüncü kişilere ait internet sitelerine bağlantılar içerebilir.</p>
                <p>Bu sitelerin içeriklerinden ve gizlilik uygulamalarından Microvise sorumlu değildir.</p>

                <h6>8. Kişisel Veriler ve Gizlilik</h6>
                <p>Kullanıcıların kişisel verileri;</p>
                <ul class="list-unstyled ps-3">
                    <li><i class="fas fa-check me-2 text-success"></i>Gizlilik Politikası,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Kişisel Verilerin Korunması ve İşlenmesi Aydınlatma Metni,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Çerez Politikası</li>
                </ul>
                <p>kapsamında işlenmektedir. Kullanıcı, bu metinleri kabul ettiğini beyan eder.</p>

                <h6>9. Sözleşmenin Değiştirilmesi</h6>
                <p>Microvise, işbu Sözleşme’yi tek taraflı olarak güncelleme hakkını saklı tutar.</p>
                <p>Güncellenen hükümler, internet sitesinde yayımlandığı tarihten itibaren geçerli olur.</p>

                <h6>10. Yürürlük ve Fesih</h6>
                <p>Kullanıcı siteyi kullandığı sürece işbu Sözleşme yürürlüktedir.</p>
                <p>Kullanıcı, siteyi kullanmayı bırakarak sözleşmeyi fiilen sona erdirebilir.</p>

                <h6>11. Uygulanacak Hukuk ve Yetkili Mahkeme</h6>
                <p>İşbu Sözleşme’nin uygulanmasında Kuzey Kıbrıs Türk Cumhuriyeti (KKTC) hukuku geçerlidir.</p>
                <p>Taraflar arasında doğabilecek uyuşmazlıklarda Lefkoşa Mahkemeleri ve İcra Daireleri yetkilidir.</p>

                <h6>12. İletişim</h6>
                <p>Sözleşme ile ilgili her türlü soru ve talep için bizimle iletişime geçebilirsiniz:</p>
                <p><strong>Microvise</strong></p>
                <p><i class="fas fa-map-marker-alt me-2"></i> Atatürk Cad. Emek 2 No:1 Yenişehir, Lefkoşa</p>
                <p><i class="fas fa-envelope me-2"></i> <a href="mailto:info@microvise.net" class="text-decoration-none">info@microvise.net</a></p>
                <p><i class="fas fa-phone me-2"></i> <a href="tel:+905488519494" class="text-decoration-none">0548 851 9494</a></p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
            </div>
        </div>
    </div>
</div>

<!-- Privacy Policy Modal -->
<div class="modal fade" id="privacyModalGlobal" tabindex="-1" aria-labelledby="privacyModalGlobalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="privacyModalGlobalLabel">GİZLİLİK POLİTİKASI</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p>İşbu Gizlilik Politikası, Microvise (“Şirket”) tarafından işletilen internet sitelerini ziyaret eden kullanıcıların, müşterilerin ve iş ortaklarının gizliliğinin korunmasına ilişkin esasları açıklamak amacıyla hazırlanmıştır.</p>
                <p>Microvise, kişisel verilerin gizliliğine ve güvenliğine önem verir; kişisel verileri 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) ve ilgili mevzuata uygun olarak işler, saklar ve korur.</p>

                <h6>1. Toplanan Bilgiler</h6>
                <p>Microvise tarafından aşağıdaki kişisel veriler toplanabilir:</p>
                <ul class="list-unstyled ps-3">
                    <li><i class="fas fa-check me-2 text-success"></i>Kimlik bilgileri (ad, soyad)</li>
                    <li><i class="fas fa-check me-2 text-success"></i>İletişim bilgileri (telefon numarası, e-posta adresi)</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Müşteri işlem bilgileri</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Talep, şikâyet ve iletişim kayıtları</li>
                    <li><i class="fas fa-check me-2 text-success"></i>İnternet sitesi kullanım bilgileri ve çerez verileri</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Teknik veriler (IP adresi, tarayıcı bilgileri vb.)</li>
                </ul>
                <p>Toplanan veriler, sunulan ürün ve hizmetin niteliğine göre değişiklik gösterebilir.</p>

                <h6>2. Kişisel Verilerin Kullanım Amaçları</h6>
                <p>Toplanan kişisel veriler aşağıdaki amaçlarla kullanılmaktadır:</p>
                <ul class="list-unstyled ps-3">
                    <li><i class="fas fa-check me-2 text-success"></i>Ürün ve hizmetlerin sunulması</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Satış ve satış sonrası destek süreçlerinin yürütülmesi</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Müşteri taleplerinin değerlendirilmesi ve sonuçlandırılması</li>
                    <li><i class="fas fa-check me-2 text-success"></i>İletişim faaliyetlerinin yürütülmesi</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Yasal yükümlülüklerin yerine getirilmesi</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Hizmet kalitesinin artırılması ve kullanıcı deneyiminin geliştirilmesi</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Bilgi güvenliği süreçlerinin yürütülmesi</li>
                </ul>

                <h6>3. Kişisel Verilerin Paylaşılması</h6>
                <p>Kişisel verileriniz;</p>
                <ul class="list-unstyled ps-3">
                    <li><i class="fas fa-check me-2 text-success"></i>İş ortakları ve tedarikçiler,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Yetkili kamu kurum ve kuruluşları,</li>
                </ul>
                <p>ile yalnızca yukarıda belirtilen amaçlar doğrultusunda ve mevzuata uygun şekilde paylaşılabilir.</p>
                <p>Microvise, kişisel verileri üçüncü kişilere satmaz, kiralamaz veya ticari amaçla paylaşmaz.</p>

                <h6>4. Kişisel Verilerin Saklanması ve Güvenliği</h6>
                <p>Microvise, kişisel verilerin güvenliğini sağlamak amacıyla gerekli teknik ve idari tedbirleri almaktadır.</p>
                <p>Kişisel veriler, işlenme amaçları doğrultusunda gerekli olan süre boyunca saklanır; sürenin sona ermesi hâlinde KVKK’ya uygun şekilde silinir, yok edilir veya anonim hâle getirilir.</p>

                <h6>5. Çerezler (Cookies)</h6>
                <p>İnternet sitemizde çerezler kullanılmaktadır.</p>
                <p>Çerezlerin kullanımına ilişkin detaylı bilgilere Çerez Politikası’ndan ulaşabilirsiniz.</p>

                <h6>6. Kişisel Verilerin Yurtdışına Aktarılması</h6>
                <p>Kişisel verileriniz; kullanılan yazılım altyapıları, e-posta hizmetleri ve teknik hizmet sağlayıcılarının yurt dışında bulunması hâlinde, KVKK’nın 9. maddesinde belirtilen şartlar çerçevesinde yurt dışına aktarılabilir.</p>
                <p>Bu aktarımlar, gerekli güvenlik önlemleri alınarak ve mevzuata uygun şekilde gerçekleştirilmektedir.</p>

                <h6>7. İlgili Kişinin Hakları</h6>
                <p>KVKK’nın 11. maddesi kapsamında ilgili kişi olarak;</p>
                <ul class="list-unstyled ps-3">
                    <li><i class="fas fa-check me-2 text-success"></i>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>İşlenmişse buna ilişkin bilgi talep etme,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>İşleme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Kişisel verilerin aktarıldığı üçüncü kişileri bilme,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Eksik veya yanlış işlenen verilerin düzeltilmesini isteme,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Kişisel verilerin silinmesini veya yok edilmesini talep etme,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>İşlenen veriler nedeniyle zarara uğramanız hâlinde tazminat talep etme</li>
                </ul>
                <p>haklarına sahipsiniz.</p>

                <h6>8. Politika Değişiklikleri</h6>
                <p>Microvise, işbu Gizlilik Politikası’nı mevzuat ve iş süreçlerindeki değişikliklere bağlı olarak güncelleme hakkını saklı tutar.</p>
                <p>Güncellemeler, internet sitesinde yayımlandığı tarihte yürürlüğe girer.</p>

                <h6>9. İletişim</h6>
                <p>Gizlilik Politikası ve kişisel verilerinizle ilgili her türlü soru ve talepleriniz için bizimle iletişime geçebilirsiniz:</p>
                <p><strong>Microvise</strong></p>
                <p><i class="fas fa-map-marker-alt me-2"></i> Atatürk Cad. Emek 2 No:1 Yenişehir, Lefkoşa</p>
                <p><i class="fas fa-envelope me-2"></i> <a href="mailto:info@microvise.net" class="text-decoration-none">info@microvise.net</a></p>
                <p><i class="fas fa-phone me-2"></i> <a href="tel:+905488519494" class="text-decoration-none">0548 851 9494</a></p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
            </div>
        </div>
    </div>
</div>

<!-- Cookie Policy Modal -->
<div class="modal fade" id="cookieModalGlobal" tabindex="-1" aria-labelledby="cookieModalGlobalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="cookieModalGlobalLabel">ÇEREZ (COOKIE) POLİTİKASI</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p>İşbu Çerez Politikası, Microvise (“Şirket”) tarafından işletilen internet sitelerini ziyaret eden kullanıcıları bilgilendirmek amacıyla hazırlanmıştır.</p>

                <h6>1. Çerez Nedir?</h6>
                <p>Çerezler (cookie), ziyaret ettiğiniz internet siteleri tarafından tarayıcınız aracılığıyla cihazınıza kaydedilen küçük metin dosyalarıdır.</p>
                <p>Çerezler, internet sitesinin düzgün çalışması, kullanıcı deneyiminin iyileştirilmesi ve sitenin geliştirilmesi amaçlarıyla kullanılmaktadır.</p>

                <h6>2. Çerez Türleri</h6>
                <p><strong>Kullanım Süresine Göre Çerezler</strong></p>
                <ul class="list-unstyled ps-3">
                    <li><i class="fas fa-check me-2 text-success"></i><strong>Oturum Çerezleri:</strong> Tarayıcı kapatıldığında silinir.</li>
                    <li><i class="fas fa-check me-2 text-success"></i><strong>Kalıcı Çerezler:</strong> Belirli bir süre boyunca cihazda saklanır.</li>
                </ul>
                <p><strong>Kullanım Amacına Göre Çerezler</strong></p>
                <ul class="list-unstyled ps-3">
                    <li><i class="fas fa-check me-2 text-success"></i><strong>Zorunlu Çerezler:</strong> İnternet sitesinin çalışması için gereklidir.</li>
                    <li><i class="fas fa-check me-2 text-success"></i><strong>Fonksiyonel Çerezler:</strong> Tercihlerinizi hatırlayarak kullanım kolaylığı sağlar.</li>
                    <li><i class="fas fa-check me-2 text-success"></i><strong>Performans / Analitik Çerezler:</strong> Site kullanımını analiz ederek performansın artırılmasına yardımcı olur.</li>
                    <li><i class="fas fa-check me-2 text-success"></i><strong>Pazarlama / Reklam Çerezleri:</strong> İlgi alanlarınıza uygun içerik ve reklam sunulmasını sağlar.</li>
                </ul>

                <h6>3. Çerezlerin Kullanım Amaçları</h6>
                <p>Microvise tarafından kullanılan çerezler aşağıdaki amaçlarla kullanılmaktadır:</p>
                <ul class="list-unstyled ps-3">
                    <li><i class="fas fa-check me-2 text-success"></i>İnternet sitesinin güvenli ve doğru şekilde çalışmasını sağlamak</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Kullanıcı deneyimini geliştirmek</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Site performansını analiz etmek</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Tercih ve ayarları hatırlamak</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Yasal yükümlülüklerin yerine getirilmesi</li>
                </ul>

                <h6>4. Çerezler Aracılığıyla İşlenen Kişisel Veriler</h6>
                <p>Çerezler aracılığıyla; IP adresi, ziyaret edilen sayfalar, tarayıcı bilgileri ve kullanım alışkanlıklarına ilişkin veriler işlenebilir.</p>
                <p>Bu veriler, KVKK kapsamında ve Kişisel Verilerin Korunması ve İşlenmesi Aydınlatma Metni’nde belirtilen amaçlarla sınırlı olarak işlenmektedir.</p>

                <h6>5. Çerezlerin Hukuki Sebebi</h6>
                <p>Çerezler;</p>
                <ul class="list-unstyled ps-3">
                    <li><i class="fas fa-check me-2 text-success"></i>KVKK’nın 5/2 maddesinde belirtilen meşru menfaat,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Kanunlarda açıkça öngörülmesi,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Açık rızanızın bulunması</li>
                </ul>
                <p>hukuki sebeplerine dayanılarak kullanılmaktadır. Zorunlu olmayan çerezler yalnızca açık rızanız alınarak kullanılmaktadır.</p>

                <h6>6. Çerezlerin Yönetilmesi</h6>
                <p>Tarayıcı ayarlarınız üzerinden çerezleri kabul edebilir, reddedebilir veya silebilirsiniz.</p>
                <p>Çerezlerin devre dışı bırakılması durumunda, internet sitesinin bazı bölümleri düzgün çalışmayabilir.</p>
                <p>Tarayıcı ayarları hakkında bilgi almak için tarayıcınızın yardım menüsünü inceleyebilirsiniz.</p>

                <h6>7. Çerezlerin Üçüncü Kişilerle Paylaşılması</h6>
                <p>Çerezler aracılığıyla elde edilen veriler, yalnızca hizmet alınan iş ortakları ve yasal yükümlülükler kapsamında yetkili kamu kurum ve kuruluşları ile paylaşılabilir.</p>

                <h6>8. Politika Güncellemeleri</h6>
                <p>Microvise, işbu Çerez Politikası’nı mevzuata ve uygulamalara bağlı olarak güncelleme hakkını saklı tutar. Güncel politika, internet sitesinde yayımlandığı tarihte yürürlüğe girer.</p>

                <h6>9. İletişim</h6>
                <p>Çerez Politikası ve kişisel verilerin korunması ile ilgili sorularınız için bizimle iletişime geçebilirsiniz:</p>
                <p><strong>Microvise</strong></p>
                <p><i class="fas fa-map-marker-alt me-2"></i> Atatürk Cad. Emek 2 No:1 Yenişehir, Lefkoşa</p>
                <p><i class="fas fa-envelope me-2"></i> <a href="mailto:info@microvise.net" class="text-decoration-none">info@microvise.net</a></p>
                <p><i class="fas fa-phone me-2"></i> <a href="tel:+905488519494" class="text-decoration-none">0548 851 9494</a></p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
            </div>
        </div>
    </div>
</div>

<!-- Refund Policy Modal -->
<div class="modal fade" id="refundModalGlobal" tabindex="-1" aria-labelledby="refundModalGlobalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="refundModalGlobalLabel">İade ve İptal Şartları</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <h6>1. Genel Bilgilendirme</h6>
                <p>Bu iade ve iptal politikası, Microvise tarafından satışı gerçekleştirilen ürünler için geçerlidir.</p>
                <p>İlgili mevzuatlar kapsamında, aşağıda belirtilen şartlar çerçevesinde iade hakkınızı kullanabilirsiniz.</p>

                <h6>2. Malileştirme Süresi ve İade Kısıtı</h6>
                <p>Satın alınan cihazlar, mali cihaz niteliğinde olması sebebiyle, fatura tarihinden itibaren 15 (on beş) gün içerisinde malileştirilmek zorundadır.</p>
                <p>Cihazın malileştirilmesinin ardından iptal veya iade işlemi yapılamaz.</p>
                <p>Bu 15 günlük süre içerisinde cihaz, yetkili saha firması tarafından malileştirilmişse, cihazın iadesi veya siparişin iptali mümkün değildir.</p>
                <p>Malileştirme işlemi tamamlandıktan sonra yalnızca devir veya hurdaya ayırma süreçleri işletilebilir. Bu işlemler, ilgili lisans sahibi ve/veya yetkili kuruluşlar tarafından ayrıca ücretlendirilebilir.</p>

                <h6>3. Malileştirilmemiş Cihazlarda İade Şartları</h6>
                <p>Cihaz henüz malileştirilmemişse, Microvise ile iletişime geçerek iade talebinde bulunabilirsiniz.</p>
                <p>İade talebinin kabul edilebilmesi için;</p>
                <ul class="list-unstyled ps-3">
                    <li><i class="fas fa-check me-2 text-success"></i>Teslimat tarihinden itibaren 8 (sekiz) gün içerisinde,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Fatura üzerinde yer alan iade alanı doldurularak,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Fatura ile birlikte,</li>
                </ul>
                <p>ürünün aşağıdaki şartları sağlaması zorunludur:</p>
                <ul class="list-unstyled ps-3">
                    <li><i class="fas fa-check me-2 text-success"></i>Orijinal kutusunda,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Tüm aksesuarları eksiksiz şekilde,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Hasarsız, çiziksiz, darbe almamış,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Koruyucu ambalaj ile paketlenmiş,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Tarafınıza gönderildiği haliyle</li>
                </ul>
                <p>Microvise’e iade edilmesi gerekmektedir.</p>
                <p>Bu şartları taşımayan ürünlerin iadesi kabul edilmez.</p>

                <h6>4. İade Gönderim Yöntemi</h6>
                <p>İade gönderimleri, yalnızca Microvise’in yönlendirdiği ve/veya anlaşmalı kargo firmaları aracılığıyla yapılmalıdır.</p>
                <p>İade sürecinde iletişime geçeceğiniz Microvise yetkilisi, uygun kargo firması bilgilerini tarafınıza iletecektir.</p>
                <p>Anlaşmalı olmayan kargo firmaları ile gönderilen ürünler teslim alınmaz.</p>
                <p>Kargo gönderim ücreti, iade sebebine göre Microvise tarafından ayrıca değerlendirilecektir.</p>

                <h6>5. İade İnceleme Süreci ve Geri Ödeme</h6>
                <p>İade edilen ürün, Microvise’e ulaştıktan sonra teknik ekip tarafından incelemeye alınır.</p>
                <p>Ürünün iade şartlarına uygun bulunması halinde, bankanızın işlem süreçlerine bağlı olarak değişiklik gösterebilmekle birlikte, 7 iş günü içerisinde ürün bedeli iade edilir.</p>
                <p>İnceleme sonucunda; kutu hasarı, aksesuar eksikliği, darbe, çizik, malileştirme işlemi yapılmış olması veya benzeri aykırılıklar tespit edilirse, ürün alıcıya geri gönderilir ve iade işlemi gerçekleştirilmez.</p>
                <p>Bu durumda oluşacak kargo bedelleri Microvise tarafından karşılanmaz.</p>

                <h6>6. Devir ve Hurdaya Ayırma İşlemleri (Malileştirme Sonrası)</h6>
                <p>Malileştirme işlemi tamamlanan cihazlar için iade mümkün değildir.</p>
                <p>Bu cihazlar için yalnızca devir veya hurdaya ayırma işlemleri yapılabilir.</p>
                <p>Devir ve hurdaya ayırma işlemleri ücretlidir.</p>
                <p>Süreç ve ücretlendirme hakkında detaylı bilgi almak için Microvise ile iletişime geçilmelidir.</p>

                <h6>7. İletişim Bilgileri</h6>
                <p><strong>Microvise</strong></p>
                <p><i class="fas fa-map-marker-alt me-2"></i> Atatürk Cad. Emek 2 No:1 Yenişehir, Lefkoşa</p>
                <p><i class="fas fa-envelope me-2"></i> <a href="mailto:info@microvise.net" class="text-decoration-none">info@microvise.net</a></p>
                <p><i class="fas fa-phone me-2"></i> <a href="tel:+905488519494" class="text-decoration-none">0548 851 9494</a></p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
            </div>
        </div>
    </div>
</div>

<!-- Consent Text Modal -->
<div class="modal fade" id="consentModalGlobal" tabindex="-1" aria-labelledby="consentModalGlobalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="consentModalGlobalLabel">KİŞİSEL VERİLERİN KORUNMASI VE İŞLENMESİ AYDINLATMA METNİ</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p>İşbu aydınlatma metni, Microvise müşterilerine ve müşterilerin çalışanlarına ait işlenen kişisel verilere ilişkin olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”)’nun 10. maddesi uyarınca hazırlanmıştır.</p>

                <h6>1. Veri Sorumlusu</h6>
                <p>KVKK madde 3, fıkra 1 (ı) bendi uyarınca veri sorumlusu; kişisel verilerin işleme amaçlarını ve vasıtalarını belirleyen, veri kayıt sisteminin kurulmasından ve yönetilmesinden sorumlu olan gerçek veya tüzel kişidir.</p>
                <p>Bu kapsamda veri sorumlusu bilgileri aşağıdaki gibidir:</p>
                <ul class="list-unstyled ps-3">
                    <li><strong>Veri Sorumlusu:</strong> Microvise</li>
                    <li><strong>Adres:</strong> Atatürk Cad. Emek 2 No:1 Yenişehir, Lefkoşa</li>
                    <li><strong>E-posta:</strong> info@microvise.net</li>
                    <li><strong>Telefon:</strong> 0548 851 9494</li>
                </ul>

                <h6>2. İşlenen Kişisel Veriler, İşleme Amaçları ve Hukuki Sebep</h6>
                <p>Microvise tarafından sunulan ürün ve hizmetler hakkında bilgi talep edilmesi, iletişim kanallarımız aracılığıyla tarafımıza ulaşılması, ürün ve hizmetlerin sunulması, satış sonrası destek süreçlerinin yürütülmesi ve ticari faaliyetlerimizin gerçekleştirilmesi amaçlarıyla; müşterilere ve müşterilerin çalışanlarına ait kişisel veriler sözlü, yazılı veya elektronik ortamda toplanmaktadır.</p>
                <p>Bu kapsamda işlenen kişisel veriler; hizmetin niteliğine göre değişiklik gösterebilmekle birlikte başta ad-soyad, telefon numarası, e-posta adresi olmak üzere, sunulan ürün ve hizmetlerin ifası için gerekli olan ve bununla sınırlı olmamak kaydıyla diğer kişisel verilerdir.</p>
                <p>Kişisel verileriniz; açık rızanızın bulunması veya KVKK’nın 5/2 maddesinde belirtilen hukuka uygunluk hallerinden en az birinin varlığı halinde, belirtilen amaçlarla sınırlı olarak işlenmektedir.</p>

                <h6>3. İşlenen Kişisel Verilerin Aktarılabileceği Taraflar</h6>
                <p>Toplanan kişisel verileriniz, KVKK ve ilgili mevzuata uygun olmak kaydıyla, yalnızca aşağıdaki alıcı grupları ile paylaşılabilir:</p>
                <ul class="list-unstyled ps-3">
                    <li><i class="fas fa-check me-2 text-success"></i>İş ortakları</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Tedarikçiler</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Yetkili kamu kurum ve kuruluşları</li>
                </ul>

                <h6>4. Kişisel Verilerin Yurtdışına Aktarılması</h6>
                <p>Elektronik posta hizmetleri, veri depolama altyapıları, yazılım ve teknik hizmet sağlayıcılarının yurt dışında bulunması gibi nedenlerle; kişisel verileriniz, KVKK’nın 9. maddesinde belirtilen şartlar çerçevesinde yurt dışına aktarılabilir.</p>
                <p>Bu aktarım, açık rızanızın bulunması veya Kanun’da belirtilen hukuki sebeplerden birinin varlığı halinde; gerekli teknik ve idari tedbirler alınarak gerçekleştirilmektedir.</p>
                <p>Microvise, kişisel verilerin yurtdışına aktarımında KVKK hükümlerine ve Kişisel Verileri Koruma Kurulu kararlarına uygun hareket etmektedir.</p>

                <h6>5. Kişisel Verileri Toplamanın Yöntemi ve Hukuki Sebebi</h6>
                <p>Kişisel verileriniz;</p>
                <ul class="list-unstyled ps-3">
                    <li><i class="fas fa-check me-2 text-success"></i>Web sitesi,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Elektronik posta,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Telefon,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Fiziki başvurular,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Dijital iletişim kanalları</li>
                </ul>
                <p>aracılığıyla doğrudan ilgili kişiden toplanmaktadır.</p>
                <p>Kişisel veriler aşağıdaki hukuki sebeplere dayanılarak işlenmektedir:</p>
                <ul class="list-unstyled ps-3">
                    <li><i class="fas fa-check me-2 text-success"></i>Kanunlarda açıkça öngörülmesi</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Sözleşmenin kurulması veya ifası için gerekli olması</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Hukuki yükümlülüklerin yerine getirilmesi</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Bir hakkın tesisi, kullanılması veya korunması</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Veri sorumlusunun meşru menfaati</li>
                    <li><i class="fas fa-check me-2 text-success"></i>İlgili kişinin açık rızası</li>
                </ul>

                <h6>6. İlgili Kişinin Hakları</h6>
                <p>KVKK’nın 11. maddesi uyarınca ilgili kişi olarak;</p>
                <ul class="list-unstyled ps-3">
                    <li><i class="fas fa-check me-2 text-success"></i>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>İşlenmişse buna ilişkin bilgi talep etme,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>İşleme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Eksik veya yanlış işlenmişse düzeltilmesini isteme,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>KVKK’ya uygun olarak silinmesini veya yok edilmesini isteme,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Bu işlemlerin üçüncü kişilere bildirilmesini talep etme,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Otomatik sistemler ile analiz edilmesi sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz etme,</li>
                    <li><i class="fas fa-check me-2 text-success"></i>Kanuna aykırı işlem nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
                </ul>
                <p>haklarına sahipsiniz.</p>

                <h6>7. Başvuru Yöntemi</h6>
                <p>KVKK kapsamındaki haklarınızı kullanmak için taleplerinizi;</p>
                <p><strong><a href="mailto:info@microvise.net" class="text-decoration-none">info@microvise.net</a></strong> e-posta adresine yazılı olarak</p>
                <p>veya <strong>Atatürk Cad. Emek 2 No:1 Yenişehir, Lefkoşa</strong> adresine bizzat ya da yazılı şekilde</p>
                <p>iletebilirsiniz.</p>
                <p>Başvurular, talebin niteliğine göre en geç 30 gün içerisinde ücretsiz olarak sonuçlandırılacaktır. İşlemin ayrıca bir maliyet gerektirmesi hâlinde, Kişisel Verileri Koruma Kurulu tarafından belirlenen tarifeye göre ücret talep edilebilir.</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
            </div>
        </div>
    </div>
</div>
<?php endif; ?>

<?php wp_footer(); ?>
</body>
</html>
