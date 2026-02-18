<?php
/* Template Name: İletişim */

$form_status = '';

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['contact_submit'])) {
    $name = sanitize_text_field($_POST['contact_name']);
    $company = sanitize_text_field($_POST['contact_company']);
    $email = sanitize_email($_POST['contact_email']);
    $phone = sanitize_text_field($_POST['contact_phone']);
    $business_type = sanitize_text_field($_POST['contact_business_type']);
    $message = sanitize_textarea_field($_POST['contact_message']);

    $to = 'info@microvise.net';
    $subject = 'Microvise İletişim Formu: ' . $name;
    
    $body = "Ad Soyad: $name\n";
    $body .= "Firma: $company\n";
    $body .= "E-posta: $email\n";
    $body .= "Telefon: $phone\n";
    $body .= "İşletme Türü: $business_type\n\n";
    $body .= "Mesaj:\n$message\n";

    $headers = array();
    $headers[] = 'Content-Type: text/plain; charset=UTF-8';
    // $headers[] = 'From: Microvise Web Sitesi <info@microvise.net>';
    $headers[] = 'Reply-To: ' . $name . ' <' . $email . '>';

    // Hata yakalama
    $mail_error_message = '';
    $action_hook = function($error) use (&$mail_error_message) {
        $mail_error_message = $error->get_error_message();
        $error_data = $error->get_error_data();
        if (isset($error_data['phpmailer_exception_code'])) {
             $mail_error_message .= ' (Kod: ' . $error_data['phpmailer_exception_code'] . ')';
        }
    };
    add_action('wp_mail_failed', $action_hook);

    if (wp_mail($to, $subject, $body, $headers)) {
        $form_status = '<div class="alert alert-success">Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.</div>';
    } else {
        $form_status = '<div class="alert alert-danger">Mesaj gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyiniz veya telefon ile iletişime geçiniz.<br><strong>Hata Detayı:</strong> ' . $mail_error_message . '</div>';
    }
    
    remove_action('wp_mail_failed', $action_hook);
}

get_header(); ?>

<div class="bg-light py-5">
    <div class="container">
        <h1 class="fw-bold text-center">İletişim</h1>
        <p class="text-center text-muted lead">Teklif almak veya ürünler hakkında bilgi almak için bize ulaşın.</p>
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb justify-content-center">
                <li class="breadcrumb-item"><a href="<?php echo home_url(); ?>">Ana Sayfa</a></li>
                <li class="breadcrumb-item active" aria-current="page">İletişim</li>
            </ol>
        </nav>
    </div>
</div>

<section class="py-5">
    <div class="container">
        <div class="row g-5">
            <div class="col-lg-5">
                <h3 class="fw-bold mb-4">İletişim Bilgileri</h3>
                <div class="d-flex mb-4">
                    <div class="flex-shrink-0">
                        <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                            <i class="fas fa-map-marker-alt"></i>
                        </div>
                    </div>
                    <div class="flex-grow-1 ms-3">
                        <h5 class="fw-bold mb-1">Adres</h5>
                        <p class="text-muted mb-0">
                            <a href="https://www.google.com/maps/dir//35.19008199675299,33.35712396779412" target="_blank" class="text-decoration-none text-muted">
                                Atatürk Cad Emek2 No:1 Yenişehir Lefkoşa KKTC
                            </a>
                        </p>
                    </div>
                </div>

                <div class="d-flex mb-4">
                    <div class="flex-shrink-0">
                        <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                            <i class="fas fa-phone-alt"></i>
                        </div>
                    </div>
                    <div class="flex-grow-1 ms-3">
                        <h5 class="fw-bold mb-1">Telefon</h5>
                        <p class="text-muted mb-0"><a href="tel:+905428519494" class="text-decoration-none text-muted">0542 851 9494</a></p>
                    </div>
                </div>

                <div class="d-flex mb-4">
                    <div class="flex-shrink-0">
                        <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                            <i class="fas fa-envelope"></i>
                        </div>
                    </div>
                    <div class="flex-grow-1 ms-3">
                        <h5 class="fw-bold mb-1">E-posta</h5>
                        <p class="text-muted mb-0"><a href="mailto:info@microvise.net" class="text-decoration-none text-muted">info@microvise.net</a></p>
                    </div>
                </div>
                
                <div class="mt-5">
                    <h5 class="fw-bold mb-3">Sosyal Medya</h5>
                    <a href="#" class="btn btn-outline-primary btn-sm me-2"><i class="fab fa-facebook-f"></i></a>
                    <a href="#" class="btn btn-outline-primary btn-sm me-2"><i class="fab fa-instagram"></i></a>
                    <a href="#" class="btn btn-outline-primary btn-sm me-2"><i class="fab fa-linkedin-in"></i></a>
                </div>
            </div>

            <div class="col-lg-7">
                <div class="bg-white p-4 rounded shadow-sm border">
                    <h3 class="fw-bold mb-4">Bize Yazın</h3>
                    <?php echo $form_status; ?>
                    <form method="post">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label for="name" class="form-label">Ad Soyad</label>
                                <input type="text" name="contact_name" class="form-control" id="name" required>
                            </div>
                            <div class="col-md-6">
                                <label for="company" class="form-label">Firma Adı (Opsiyonel)</label>
                                <input type="text" name="contact_company" class="form-control" id="company">
                            </div>
                            <div class="col-md-6">
                                <label for="email" class="form-label">E-posta</label>
                                <input type="email" name="contact_email" class="form-control" id="email" required>
                            </div>
                            <div class="col-md-6">
                                <label for="phone" class="form-label">Telefon</label>
                                <input type="tel" name="contact_phone" class="form-control" id="phone" required>
                            </div>
                            <div class="col-12">
                                <label for="subject" class="form-label">İşletme Türü</label>
                                <select class="form-select" name="contact_business_type" id="subject">
                                    <option selected value="">Seçiniz...</option>
                                    <option value="Market">Market</option>
                                    <option value="Kafe / Restoran">Kafe / Restoran</option>
                                    <option value="Perakende Mağaza">Perakende Mağaza</option>
                                    <option value="Diğer">Diğer</option>
                                </select>
                            </div>
                            <div class="col-12">
                                <label for="message" class="form-label">Mesajınız</label>
                                <textarea class="form-control" name="contact_message" id="message" rows="5" required></textarea>
                            </div>
                            <div class="col-12">
                                <button type="submit" name="contact_submit" class="btn btn-primary w-100 py-2">Gönder</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        
        <!-- Harita -->
        <div class="row mt-5">
            <div class="col-12">
                <div class="rounded overflow-hidden shadow-sm position-relative group-hover-overlay">
                    <iframe src="https://maps.google.com/maps?q=35.19008199675299,33.35712396779412&hl=tr&z=15&output=embed" width="100%" height="400" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
                    <a href="https://www.google.com/maps/dir//35.19008199675299,33.35712396779412" target="_blank" class="btn btn-primary position-absolute bottom-0 start-50 translate-middle-x mb-4 shadow-lg px-4 py-2 rounded-pill">
                        <i class="fas fa-location-arrow me-2"></i>Yol Tarifi Al
                    </a>
                </div>
            </div>
        </div>
    </div>
</section>

<?php get_footer(); ?>
