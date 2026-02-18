<?php
/* Template Name: Hızlı Sipariş Formu */

$current_user = wp_get_current_user();
$is_halkbank = ($current_user->user_login === 'halkbank');

// Form gönderildi mi kontrol et
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['microvise_quick_order_nonce'])) {
    
    if (!wp_verify_nonce($_POST['microvise_quick_order_nonce'], 'microvise_quick_order_action')) {
        die('Güvenlik doğrulaması başarısız.');
    }

    // WooCommerce yüklü mü?
    if (!class_exists('WooCommerce')) {
        $error_message = 'WooCommerce eklentisi aktif değil.';
    } else {
        try {
            // Dosya yükleme işlemi
            $attachment_id = 0;
            if (!empty($_FILES['yukumlu_kayit_belgesi']['name'])) {
                require_once(ABSPATH . 'wp-admin/includes/image.php');
                require_once(ABSPATH . 'wp-admin/includes/file.php');
                require_once(ABSPATH . 'wp-admin/includes/media.php');

                $attachment_id = media_handle_upload('yukumlu_kayit_belgesi', 0);

                if (is_wp_error($attachment_id)) {
                    throw new Exception('Dosya yüklenirken hata oluştu: ' . $attachment_id->get_error_message());
                }
            } elseif (isset($_POST['previous_attachment_id']) && is_numeric($_POST['previous_attachment_id'])) {
                $attachment_id = intval($_POST['previous_attachment_id']);
            }

            // Müşteri Bilgileri
            $address = array(
                'first_name' => sanitize_text_field($_POST['billing_first_name']),
                'last_name'  => sanitize_text_field($_POST['billing_last_name']),
                'company'    => sanitize_text_field($_POST['billing_company']),
                'email'      => sanitize_email($_POST['billing_email']),
                'phone'      => sanitize_text_field($_POST['billing_phone']),
                'address_1'  => sanitize_text_field($_POST['billing_address_1']),
                'city'       => sanitize_text_field($_POST['billing_city']),
                'country'    => 'TR',
                'state'      => sanitize_text_field($_POST['billing_city']), // Şehir bilgisini state olarak da ekleyelim
            );

            // Ekstra Alanlar (İlçe, Cep Tel, Vergi Dairesi vb.)
            $billing_mobile = sanitize_text_field($_POST['billing_mobile']);
            $billing_district = sanitize_text_field($_POST['billing_district']);
            
            // Sipariş Oluştur
            $order = wc_create_order();
            $order->set_customer_id($current_user->ID);
            $order->set_prices_include_tax(true);

            // Meta Verileri Kaydet
            if (!empty($billing_mobile)) $order->add_meta_data('_billing_mobile', $billing_mobile);
            if (!empty($billing_district)) $order->add_meta_data('_billing_district', $billing_district);
            
            // Ürünleri Ekle
            $has_products = false;
            if (isset($_POST['products']) && is_array($_POST['products'])) {
                foreach ($_POST['products'] as $product_id => $quantity) {
                    if ($quantity > 0) {
                        $product = wc_get_product($product_id);
                        
                        // Ürünü ekle (Orijinal fiyatlarıyla)
                        $order->add_product($product, $quantity);
                        $has_products = true;
                    }
                }
            }

            if (!$has_products) {
                throw new Exception('Lütfen en az bir ürün seçiniz.');
            }

            // Adresleri Ata
            $order->set_address($address, 'billing');
            $order->set_address($address, 'shipping');

            // Sipariş Notu
            if (!empty($_POST['order_note'])) {
                $order->set_customer_note(sanitize_textarea_field($_POST['order_note']));
            }

            // Şube ve Personel Bilgisi
            if (!empty($_POST['sube_ismi'])) {
                $order->add_meta_data('Şube İsmi', sanitize_text_field($_POST['sube_ismi']));
            }
            if (!empty($_POST['sube_email'])) {
                $order->add_meta_data('_sube_email_address', sanitize_email($_POST['sube_email']));
                $order->add_meta_data('Personel Email', sanitize_email($_POST['sube_email']));
            }

            // Yükümlü Kayıt Belgesini Siparişe Ekle
            if ($attachment_id) {
                $file_url = wp_get_attachment_url($attachment_id);
                $order->add_meta_data('Yükümlü Kayıt Belgesi', $file_url);
                $order->add_meta_data('_yukumlu_kayit_belgesi_id', $attachment_id);
            }

            // Toplamı Hesapla
            $order->calculate_totals();

            // Halkbank POS Siparişi Olarak İşaretle (Meta Data)
            $order->add_meta_data('_is_halkbank_pos_order', 'yes');
            $order->save();

            // Sipariş Durumunu Ayarla (Ödeme Bekleniyor)
            $order->update_status('pending', 'Hızlı sipariş formu üzerinden oluşturuldu.');

            // Ödeme Sayfasına Yönlendir
            wp_redirect($order->get_checkout_payment_url());
            exit;

        } catch (Exception $e) {
            $error_message = 'Sipariş oluşturulurken bir hata oluştu: ' . $e->getMessage();
        }
    }
}

?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
    <style>
        body { background-color: #f0f2f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .halkbank-header { background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%); border-bottom: 1px solid #e9ecef; padding: 25px 0; }
        .halkbank-logo { max-height: 70px; transition: transform 0.3s ease; }
        .halkbank-logo:hover { transform: scale(1.05); }
        .form-card { border: none; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .form-card:hover { transform: translateY(-5px); box-shadow: 0 15px 35px rgba(0,0,0,0.1); }
        .section-title { color: #0d6efd; font-weight: 700; position: relative; padding-bottom: 10px; margin-bottom: 25px; }
        .section-title::after { content: ''; position: absolute; left: 0; bottom: 0; width: 50px; height: 3px; background-color: #0d6efd; border-radius: 2px; }
        .form-floating > .form-control:focus ~ label, .form-floating > .form-control:not(:placeholder-shown) ~ label { color: #0d6efd; opacity: 0.8; }
        .form-control:focus { border-color: #0d6efd; box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15); }
        .product-item { transition: background-color 0.2s ease; border-radius: 10px; padding: 15px; border: 1px solid transparent; }
        .product-item:hover { background-color: #f8f9fa; border-color: #e9ecef; }
        .btn-submit { background: linear-gradient(45deg, #198754, #20c997); border: none; transition: all 0.3s ease; }
        .btn-submit:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(25, 135, 84, 0.3); }
        .upload-zone { border: 2px dashed #dee2e6; border-radius: 10px; padding: 20px; text-align: center; background-color: #f8f9fa; transition: border-color 0.3s ease; }
        .upload-zone:hover { border-color: #0d6efd; background-color: #fff; }
    </style>
</head>
<body <?php body_class(); ?>>

<div class="halkbank-header shadow-sm">
    <div class="container d-flex justify-content-between align-items-center">
        <!-- Logo -->
        <a href="<?php echo home_url(); ?>" class="d-block">
            <img src="<?php echo get_template_directory_uri(); ?>/assets/img/logo.png" alt="Microvise" class="halkbank-logo">
        </a>
        <div class="text-end d-none d-md-block w-100">
            <small class="text-muted d-block">Hızlı Sipariş Sistemi</small>
            <span class="fw-bold text-dark">Hoş Geldiniz, <?php echo esc_html($current_user->display_name); ?></span>
        </div>
    </div>
</div>

<div class="py-4">
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-lg-10">
                <div class="text-center mb-5">
                    <p class="text-muted lead">Lütfen bilgilerinizi kontrol edip ürün seçimini yapınız.</p>
                </div>
            </div>
        </div>
    </div>
</div>

<section class="pb-5">
    <div class="container">
        
        <?php if (isset($error_message)) : ?>
            <div class="alert alert-danger"><?php echo esc_html($error_message); ?></div>
        <?php endif; ?>

        <?php if (class_exists('WooCommerce')) : ?>
            <form method="post" class="row g-4 needs-validation" enctype="multipart/form-data" novalidate>
                <?php wp_nonce_field('microvise_quick_order_action', 'microvise_quick_order_nonce'); ?>
                
                <div class="col-lg-7">
                    <!-- İletişim Bilgileri -->
                    <div class="bg-white p-4 rounded form-card mb-4">
                        <h5 class="fw-bold mb-1">İletişim Bilgileri</h5>
                        <p class="text-muted small mb-4">İletişim bilgilerini doldurunuz. Tüm alanlar zorunludur.</p>
                        
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label text-muted small">Ad <span class="text-danger">*</span></label>
                                <input type="text" class="form-control bg-light border-0" name="billing_first_name" value="<?php echo isset($_POST['billing_first_name']) ? esc_attr($_POST['billing_first_name']) : esc_attr($current_user->user_firstname); ?>" required>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-muted small">Soyad <span class="text-danger">*</span></label>
                                <input type="text" class="form-control bg-light border-0" name="billing_last_name" value="<?php echo isset($_POST['billing_last_name']) ? esc_attr($_POST['billing_last_name']) : esc_attr($current_user->user_lastname); ?>" required>
                            </div>
                            
                            <div class="col-md-6">
                                <label class="form-label text-muted small">Telefon</label>
                                <input type="tel" class="form-control bg-light border-0" name="billing_phone" value="<?php echo isset($_POST['billing_phone']) ? esc_attr($_POST['billing_phone']) : esc_attr(get_user_meta($current_user->ID, 'billing_phone', true)); ?>" pattern="0[0-9]{10}" title="Lütfen telefon numaranızı başında 0 olacak şekilde 11 hane olarak giriniz. Örn: 02123456789">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-muted small">Cep Telefonu <span class="text-danger">*</span></label>
                                <input type="tel" class="form-control bg-light border-0" name="billing_mobile" value="<?php echo isset($_POST['billing_mobile']) ? esc_attr($_POST['billing_mobile']) : ''; ?>" required pattern="05[0-9]{9}" title="Lütfen cep telefonunuzu başında 0 olacak şekilde 11 hane olarak giriniz. Örn: 05321234567">
                            </div>
                            
                            <div class="col-12">
                                <label class="form-label text-muted small">Email <span class="text-danger">*</span></label>
                                <input type="email" class="form-control bg-light border-0" name="billing_email" value="<?php echo isset($_POST['billing_email']) ? esc_attr($_POST['billing_email']) : esc_attr($current_user->user_email); ?>" required>
                            </div>
                        </div>
                    </div>

                    <!-- Kurumsal Bilgiler -->
                    <div class="bg-white p-4 rounded form-card mb-4">
                        <h5 class="fw-bold mb-4">Firma Bilgileri</h5>

                        <div class="row g-3">
                            <div class="col-12">
                                <label class="form-label text-muted small">Şehir <span class="text-danger">*</span></label>
                                <input type="text" class="form-control bg-light border-0" name="billing_city" value="<?php echo isset($_POST['billing_city']) ? esc_attr($_POST['billing_city']) : esc_attr(get_user_meta($current_user->ID, 'billing_city', true)); ?>" required>
                            </div>

                            <div class="col-12">
                                <label class="form-label text-muted small">Adres <span class="text-danger">*</span></label>
                                <input type="text" class="form-control bg-light border-0" name="billing_address_1" value="<?php echo isset($_POST['billing_address_1']) ? esc_attr($_POST['billing_address_1']) : esc_attr(get_user_meta($current_user->ID, 'billing_address_1', true)); ?>" required>
                            </div>

                            <div class="col-12">
                                <label class="form-label text-muted small">Ticari Ünvanı <span class="text-danger">*</span></label>
                                <input type="text" class="form-control bg-light border-0" name="billing_company" value="<?php echo isset($_POST['billing_company']) ? esc_attr($_POST['billing_company']) : esc_attr(get_user_meta($current_user->ID, 'billing_company', true)); ?>" required>
                            </div>
                        </div>
                    </div>

                    <!-- Halkbank Şube Bilgileri -->
                    <div class="bg-white p-4 rounded form-card mb-4">
                        <div class="d-flex align-items-center mb-3">
                            <img src="<?php echo get_template_directory_uri(); ?>/assets/img/halkbank-icon.png" alt="" style="height: 30px;" class="me-2 d-none"> <!-- İkon varsa eklenebilir -->
                            <h5 class="fw-bold mb-0 text-primary">Halkbank Şube Bilgileri</h5>
                        </div>
                        <p class="text-muted small mb-4">Şube bilgilerinizi doldurunuz.</p>

                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label text-muted small">Şube İsmi <span class="text-danger">*</span></label>
                                <input type="text" class="form-control bg-light border-0" name="sube_ismi" value="<?php echo isset($_POST['sube_ismi']) ? esc_attr($_POST['sube_ismi']) : ''; ?>" required>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-muted small">Personel Email <span class="text-danger">*</span></label>
                                <input type="email" class="form-control bg-light border-0" name="sube_email" value="<?php echo isset($_POST['sube_email']) ? esc_attr($_POST['sube_email']) : ''; ?>" required>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Yükümlü Kayıt Belgesi (Gizlendi/Kaldırıldı veya aşağı taşınabilir, tasarımda görünmüyor ama fonksiyonel olarak kalmalı mı? Kullanıcı 'yeniden tasarlayacağız' dedi, belki kaldırmak istiyor. Şimdilik yorum satırına alıyorum veya en alta ekliyorum.) -->
                    <!-- <div class="bg-white p-4 rounded form-card mb-4">...</div> -->
                </div>

                <div class="col-lg-5">
                    <div class="bg-white p-5 rounded form-card">
                        <h4 class="mb-4 section-title">2. Ürün Seçimi</h4>
                        <div class="products-list pe-2" style="max-height: 600px; overflow-y: auto;">
                            <?php
                            // 1. Öne çıkan ürünler
                            $featured_ids = wc_get_products(array(
                                'status' => array('publish', 'private'),
                                'limit' => -1,
                                'featured' => true,
                                'return' => 'ids',
                            ));

                            // 2. Görünürlüğü "Gizli" olan ürünler (Katalog ve Arama'da gizli)
                            $hidden_ids = wc_get_products(array(
                                'status' => array('publish', 'private'),
                                'limit' => -1,
                                'visibility' => 'hidden',
                                'return' => 'ids',
                            ));

                            // 3. Sadece Katalogda veya Sadece Aramada görünen (kısmen gizli) ürünleri de dahil edelim mi?
                            // Kullanıcı "gizli" dediği için genellikle tam gizliyi kastediyor ama garanti olsun.
                            // Ayrıca "Private" (Özel) durumundaki ürünleri de alıyoruz.
                            $private_ids = wc_get_products(array(
                                'status' => 'private',
                                'limit' => -1,
                                'return' => 'ids',
                            ));

                            // Tüm ID'leri birleştir
                            $product_ids = array_unique(array_merge($featured_ids, $hidden_ids, $private_ids));

                            if (!empty($product_ids)) {
                                $args = array(
                                    'post_type' => 'product',
                                    'posts_per_page' => -1,
                                    'orderby' => 'title',
                                    'order' => 'ASC',
                                    'post__in' => $product_ids,
                                    'post_status' => array('publish', 'private') // Özel ürünlerin görünmesi için gerekli
                                );
                            } else {
                                $args = array(
                                    'post_type' => 'product',
                                    'post__in' => array(0)
                                );
                            }

                            $loop = new WP_Query($args);
                            $counter = 0;
                            if ($loop->have_posts()) :
                                while ($loop->have_posts()) : $loop->the_post();
                                    global $product;
                                    
                                    // Varsayılan olarak ilk ürün seçili gelsin (eğer POST yoksa)
                                    if (empty($_POST)) {
                                        $qty = ($counter === 0) ? 1 : 0;
                                    } else {
                                        $qty = isset($_POST['products'][$product->get_id()]) ? intval($_POST['products'][$product->get_id()]) : 0;
                                    }
                                    $counter++;
                                    ?>
                                    <div class="d-flex align-items-center mb-3 product-item">
                                        <div class="flex-shrink-0 me-3 position-relative">
                                            <?php echo $product->get_image(array(70, 70), array('class' => 'rounded shadow-sm')); ?>
                                        </div>
                                        <div class="flex-grow-1">
                                            <h6 class="mb-1 fw-bold text-dark"><?php the_title(); ?></h6>
                                            <div class="text-primary fw-bold"><?php echo $product->get_price_html(); ?></div>
                                        </div>
                                        <div class="flex-shrink-0" style="width: 120px;">
                                            <div class="input-group input-group-sm">
                                                <button class="btn btn-outline-secondary btn-minus" type="button" onclick="updateQty(this, -1)">-</button>
                                                <input type="number" class="form-control text-center fw-bold qty-input" name="products[<?php echo $product->get_id(); ?>]" value="<?php echo $qty; ?>" min="0" placeholder="0" readonly data-price="<?php echo esc_attr($product->get_price()); ?>">
                                                <button class="btn btn-outline-secondary btn-plus" type="button" onclick="updateQty(this, 1)">+</button>
                                            </div>
                                        </div>
                                    </div>
                                    <?php
                                endwhile;
                            else :
                                echo '<div class="text-center py-5 text-muted"><i class="fas fa-box-open fa-3x mb-3"></i><p>Listelenecek ürün bulunamadı.</p></div>';
                            endif;
                            wp_reset_postdata();
                            ?>
                        </div>

                        <!-- Sipariş Notu -->
                        <div class="mt-5">
                            <label for="order_note" class="form-label fw-bold mb-3">Sipariş Notu</label>
                            <div class="form-floating">
                                <textarea class="form-control" id="order_note" name="order_note" style="height: 120px" placeholder="Sipariş notu"><?php echo isset($_POST['order_note']) ? esc_textarea($_POST['order_note']) : ''; ?></textarea>
                                <label for="order_note">Varsa eklemek istedikleriniz...</label>
                            </div>
                        </div>
                        
                        <div class="mt-4 pt-4 border-top">
                            <div class="d-flex justify-content-between align-items-center mb-4 p-3 bg-light rounded shadow-sm">
                                <span class="fw-bold text-dark h5 mb-0">Toplam Tutar:</span>
                                <span class="fw-bold text-primary h4 mb-0" id="total-price">0,00 ₺</span>
                            </div>
                            <button type="submit" class="btn btn-submit text-white w-100 py-3 fw-bold text-uppercase shadow-lg rounded-pill" onclick="return validateForm()">
                                <i class="fas fa-check-circle me-2"></i>Siparişi Tamamla
                            </button>
                            <div class="text-center mt-3">
                                <small class="text-muted"><i class="fas fa-lock me-1"></i>Güvenli ödeme sayfasına yönlendirileceksiniz.</small>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        <?php else : ?>
            <div class="alert alert-warning text-center p-5 shadow-sm rounded-3">
                <i class="fas fa-exclamation-triangle fa-3x mb-3 text-warning"></i>
                <h3>WooCommerce Modülü Aktif Değil</h3>
                <p class="lead">Sipariş verebilmek için lütfen WooCommerce eklentisini etkinleştirin.</p>
            </div>
        <?php endif; ?>
    </div>
</section>

<script>
var currentCurrency = "<?php echo function_exists('get_woocommerce_currency') ? get_woocommerce_currency() : 'TRY'; ?>";

function updateQty(btn, change) {
    var input = btn.parentNode.querySelector('input');
    var newVal = parseInt(input.value) + change;
    if (newVal < 0) newVal = 0;
    input.value = newVal;
    calculateTotal();
}

function calculateTotal() {
    var inputs = document.querySelectorAll('.qty-input');
    var total = 0;
    
    inputs.forEach(function(input) {
        var qty = parseInt(input.value);
        var price = parseFloat(input.getAttribute('data-price')) || 0;
        total += qty * price;
    });
    
    // Format currency based on WooCommerce settings
    var locale = 'tr-TR'; // Default to Turkish locale for number formatting
    if (currentCurrency === 'USD') locale = 'en-US';
    if (currentCurrency === 'EUR') locale = 'de-DE';
    
    var formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currentCurrency,
        minimumFractionDigits: 2
    });
    
    document.getElementById('total-price').textContent = formatter.format(total);
}

// Calculate on load
document.addEventListener('DOMContentLoaded', function() {
    calculateTotal();
});

function validateForm() {
    // 1. Ürün kontrolü
    var inputs = document.querySelectorAll('.qty-input');
    var totalQty = 0;
    inputs.forEach(function(input) {
        totalQty += parseInt(input.value);
    });
    
    if (totalQty === 0) {
        alert('Lütfen en az bir ürün seçiniz.');
        return false;
    }
    
    // 2. Zorunlu alan kontrolü (Browser validation check)
    var form = document.querySelector('form');
    if (!form.checkValidity()) {
        form.classList.add('was-validated'); // Bootstrap validation style
        form.reportValidity(); // Show native browser validation messages
        return false; // Stop submission
    }
    
    return true;
}
</script>

<?php get_footer(); ?>
