<?php
/**
 * Microvise Theme Functions
 */

function microvise_setup() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    register_nav_menus(array(
        'primary' => __('Ana Menü', 'microvise'),
        'footer' => __('Footer Menü', 'microvise'),
    ));
    add_theme_support('custom-logo', array(
        'height' => 100,
        'width' => 400,
        'flex-height' => true,
        'flex-width' => true,
    ));
    
    add_theme_support('woocommerce');
    add_theme_support('wc-product-gallery-zoom');
    add_theme_support('wc-product-gallery-lightbox');
    add_theme_support('wc-product-gallery-slider');
}
add_action('after_setup_theme', 'microvise_setup');

function microvise_scripts() {
    // Bootstrap CSS
    wp_enqueue_style('bootstrap', 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css', array(), '5.3.0');
    // Font Awesome
    wp_enqueue_style('font-awesome', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css', array(), '6.4.0');
    // Main Style
    wp_enqueue_style('microvise-style', get_stylesheet_uri(), array('bootstrap'), '1.0.0');
    
    // Bootstrap JS
    wp_enqueue_script('bootstrap', 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js', array(), '5.3.0', true);
}
add_action('wp_enqueue_scripts', 'microvise_scripts');

/**
 * Sayfaları Otomatik Oluştur
 */
function microvise_create_pages() {
    // Sayfa tanımları
    $pages = array(
        'Hakkımızda' => 'page-about.php',
        'Referanslar' => 'page-references.php',
        'İletişim' => 'page-contact.php',
        'Çözüm Ortakları' => 'page-cozum-ortaklari.php',
        'Entegratörler' => 'page-integrators.php',
        'Ürünler' => 'page-products.php',
        'Servis & Destek' => 'page-service-support.php',
        'Halkbank YazarkasaPOS' => 'page-halkbank-yazarkasapos.php'
    );

    foreach ($pages as $title => $template) {
        $page_check = get_page_by_title($title);
        if (!isset($page_check->ID)) {
            $new_page_id = wp_insert_post(array(
                'post_title' => $title,
                'post_type' => 'page',
                'post_status' => 'publish',
                'post_content' => ''
            ));
            
            if ($new_page_id && !empty($template)) {
                update_post_meta($new_page_id, '_wp_page_template', $template);
            }
        }
    }
}
add_action('after_setup_theme', 'microvise_create_pages');

/**
 * WooCommerce Ürünlerini Oluştur (Demo İçin)
 */
/**
 * Seed Dummy Blog Posts - DELETED
 */
function microvise_seed_woocommerce_products() {
    if (class_exists('WooCommerce') && !get_transient('microvise_products_seeded_v4')) {
        
        $products = array(
            array(
                'name' => 'Ingenico Move 5000F',
                'price' => '1500',
                'description' => 'Yeni nesil yazar kasa POS cihazı.',
                'image' => 'ingenico-move5000f.png',
                'featured' => true
            ),
            array(
                'name' => 'Profilo S900 ECR',
                'price' => '1200',
                'description' => 'Hızlı ve güvenilir yazar kasa POS.',
                'image' => 'profilo-s900.png',
                'featured' => true
            ),
            array(
                'name' => 'Hugin VX 675',
                'price' => '1350',
                'description' => 'Kompakt ve güçlü yazar kasa POS.',
                'image' => 'hugin-vx675.png',
                'featured' => false
            ),
            array(
                'name' => 'Beko 300 TR',
                'price' => '1400',
                'description' => 'Dayanıklı ve uzun ömürlü POS çözümü.',
                'image' => 'beko-300tr.png',
                'featured' => false
            ),
             array(
                'name' => 'Olivetti PBT 900',
                'price' => '1600',
                'description' => 'Yüksek performanslı POS cihazı.',
                'image' => 'olivetti-pbt900.png',
                'featured' => true
            ),
             array(
                'name' => 'Vera Delta',
                'price' => '1450',
                'description' => 'Kullanıcı dostu arayüz.',
                'image' => 'vera-delta.png',
                'featured' => false
            )
        );

        foreach ($products as $p) {
            $existing_product = get_page_by_title($p['name'], OBJECT, 'product');
            
            if (!$existing_product) {
                $product = new WC_Product_Simple();
                $product->set_name($p['name']);
                $product->set_slug(sanitize_title($p['name']));
                $product->set_regular_price($p['price']);
                $product->set_description($p['description']);
                $product->set_short_description($p['description']);
                $product->set_status('publish');
                $product->set_catalog_visibility('visible');
                $product->set_featured($p['featured']);
                
                // Resmi ayarla
                $image_path = get_theme_file_path('/assets/img/' . $p['image']);
                if (file_exists($image_path)) {
                    $upload_dir = wp_upload_dir();
                    $upload_path = $upload_dir['path'] . '/' . $p['image'];
                    
                    if (!file_exists($upload_dir['path'])) {
                        wp_mkdir_p($upload_dir['path']);
                    }

                    copy($image_path, $upload_path);
                    
                    $wp_filetype = wp_check_filetype($p['image'], null);
                    $attachment = array(
                        'post_mime_type' => $wp_filetype['type'],
                        'post_title' => sanitize_file_name($p['image']),
                        'post_content' => '',
                        'post_status' => 'inherit'
                    );
                    
                    $attach_id = wp_insert_attachment($attachment, $upload_path);
                    
                    require_once(ABSPATH . 'wp-admin/includes/image.php');
                    $attach_data = wp_generate_attachment_metadata($attach_id, $upload_path);
                    wp_update_attachment_metadata($attach_id, $attach_data);
                    
                    $product->set_image_id($attach_id);
                }
                
                $product->save();
            }
        }
        
        set_transient('microvise_products_seeded_v4', true, WEEK_IN_SECONDS);
    }
}
add_action('init', 'microvise_seed_woocommerce_products');

/**
 * Auto-fix missing product images (Run once)
 */
function microvise_auto_fix_product_images() {
    if (!get_transient('microvise_image_fix_run_v2')) {
        $product_title = 'Ingenico Move 5000F';
        $image_filename = 'ingenico-move5000f.png';
        
        $product = get_page_by_title($product_title, OBJECT, 'product');
        
        if ($product) {
            $image_path = get_theme_file_path('/assets/img/' . $image_filename);
            
            if (file_exists($image_path)) {
                $upload_dir = wp_upload_dir();
                $upload_path = $upload_dir['path'] . '/' . $image_filename;
                
                if (!file_exists($upload_dir['path'])) {
                    wp_mkdir_p($upload_dir['path']);
                }

                copy($image_path, $upload_path);
                
                $wp_filetype = wp_check_filetype($image_filename, null);
                $attachment = array(
                    'post_mime_type' => $wp_filetype['type'],
                    'post_title' => sanitize_file_name($image_filename),
                    'post_content' => '',
                    'post_status' => 'inherit'
                );
                
                $attach_id = wp_insert_attachment($attachment, $upload_path, $product->ID);
                
                require_once(ABSPATH . 'wp-admin/includes/image.php');
                $attach_data = wp_generate_attachment_metadata($attach_id, $upload_path);
                wp_update_attachment_metadata($attach_id, $attach_data);
                
                set_post_thumbnail($product->ID, $attach_id);
            }
        }
        
        set_transient('microvise_image_fix_run_v2', true, WEEK_IN_SECONDS);
    }
}
add_action('init', 'microvise_auto_fix_product_images');

/**
 * Helper: Mevcut sayfanın Halkbank POS siparişi olup olmadığını kontrol eder.
 */
function microvise_is_halkbank_order_page() {
    global $wp;

    if ( ! function_exists('is_checkout') || ! is_checkout() ) {
        return false;
    }

    $order_id = 0;

    // Order Pay (Ödeme Sayfası)
    if ( ! empty( $wp->query_vars['order-pay'] ) ) {
        $order_id = absint( $wp->query_vars['order-pay'] );
    }
    // Order Received (Sipariş Alındı Sayfası)
    elseif ( ! empty( $wp->query_vars['order-received'] ) ) {
        $order_id = absint( $wp->query_vars['order-received'] );
    }

    if ( $order_id > 0 ) {
        $order = wc_get_order( $order_id );
        if ( $order ) {
            // Meta verisi kontrolü
            if ( $order->get_meta('_is_halkbank_pos_order') === 'yes' ) {
                return true;
            }
            // Fallback: Sipariş sahibi 'halkbank' kullanıcısı mı?
            $user = $order->get_user();
            if ( $user && $user->user_login === 'halkbank' ) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Sipariş Tamamlandı Sayfasına Geri Dön Butonu Ekle
 */
add_action('woocommerce_thankyou', 'microvise_add_return_button', 20);
function microvise_add_return_button($order_id) {
    $order = wc_get_order($order_id);
    if ( $order ) {
        $is_halkbank = ($order->get_meta('_is_halkbank_pos_order') === 'yes');
        
        if ( ! $is_halkbank ) {
            $user = $order->get_user();
            if ( $user && $user->user_login === 'halkbank' ) {
                $is_halkbank = true;
            }
        }

        if ( $is_halkbank ) {
        ?>
        <div class="text-center mt-5 mb-5">
            <a href="<?php echo home_url('/halkbank-yazarkasapos/'); ?>" class="btn btn-lg btn-success text-white px-5 py-3 rounded-pill shadow-sm fw-bold">
                <i class="fas fa-undo me-2"></i> Halkbank YazarkasaPOS Sayfasına Dön
            </a>
        </div>
        <?php
        }
    }
}

/**
 * Sipariş Ödeme Sayfasına (Pay for Order) Geri Dön Butonu Ekle
 */
add_action('woocommerce_before_pay_order_form', 'microvise_add_back_button_to_pay_page');
function microvise_add_back_button_to_pay_page($order) {
    if ( $order ) {
        $is_halkbank = ($order->get_meta('_is_halkbank_pos_order') === 'yes');
        
        if ( ! $is_halkbank ) {
            $user = $order->get_user();
            if ( $user && $user->user_login === 'halkbank' ) {
                $is_halkbank = true;
            }
        }

        if ( $is_halkbank ) {
        ?>
        <div class="mb-4">
            <a href="<?php echo home_url('/halkbank-yazarkasapos/'); ?>" class="btn btn-outline-secondary">
                <i class="fas fa-arrow-left me-2"></i> Geri Dön (Siparişi İptal Et)
            </a>
        </div>
        <?php
        }
    }
}

/**
 * Şube E-posta Adresini İlgili Maillere BCC Olarak Ekle
 */
add_filter( 'woocommerce_email_headers', 'microvise_add_branch_bcc_to_emails', 10, 3 );
function microvise_add_branch_bcc_to_emails( $header, $email_id, $order ) {
    // Şubeye gönderilecek mail tipleri: Yeni Sipariş (Admin), Müşteri İşleniyor, Tamamlandı, Beklemede
    $target_emails = array( 
        'new_order', 
        'customer_processing_order', 
        'customer_completed_order', 
        'customer_on_hold_order' 
    );
    
    if ( in_array( $email_id, $target_emails ) ) {
        if ( $order && is_a( $order, 'WC_Order' ) ) {
            $sube_email = $order->get_meta('_sube_email_address');
            
            if ( ! empty($sube_email) && is_email($sube_email) ) {
                // Header stringini temizle ve BCC ekle
                $header = trim($header);
                $header .= "\r\n" . 'Bcc: ' . $sube_email . "\r\n";
            }
        }
    }
    
    return $header;
}

// Gönderen Adı ve E-posta Adresini Düzenle
add_filter('wp_mail_from_name', function($original_email_from_name) {
    return 'Microvise Innovation'; // E-postada görünecek gönderen adı
});

add_filter('wp_mail_from', function($original_email_address) {
    // Eğer admin mail adresi varsa onu kullan, yoksa varsayılan kalsın
    return get_option('admin_email'); 
});

/**
 * Ödeme Sayfası Özelleştirmeleri
 * - Ülke: Sadece KKTC
 * - Şehir: Sadece belirli şehirler (Select box)
 */

// 1. Mevcut 'TR' kodunu 'KKTC' olarak yeniden adlandır ve diğer ülkeleri kaldır
add_filter( 'woocommerce_countries', 'microvise_rename_turkey_to_kktc' );
function microvise_rename_turkey_to_kktc( $countries ) {
    $countries['TR'] = 'KKTC';
    return $countries;
}

// 2. Satış ve gönderim yapılan ülkeleri sadece 'TR' (KKTC) ile sınırla
add_filter( 'woocommerce_countries_allowed_countries', 'microvise_limit_countries_to_kktc' );
add_filter( 'woocommerce_shipping_countries', 'microvise_limit_countries_to_kktc' );

function microvise_limit_countries_to_kktc( $countries ) {
    return array( 'TR' => 'KKTC' );
}

// 3. Şehir alanını dropdown yap (bizim liste kalsın), Eyalet (State) alanını kaldır
add_filter( 'woocommerce_default_address_fields', 'microvise_override_default_address_fields' );
function microvise_override_default_address_fields( $fields ) {
    // Şehirler listesi (koru)
    $cities = array(
        '' => 'Şehir Seçiniz',
        'Lefkoşa' => 'Lefkoşa',
        'Girne' => 'Girne',
        'Gazimağusa' => 'Gazimağusa',
        'Güzelyurt' => 'Güzelyurt',
        'Lefke' => 'Lefke',
        'İskele' => 'İskele'
    );

    // Şehir alanını düzenle (dropdown ve zorunlu)
    $fields['city']['type'] = 'select';
    $fields['city']['options'] = $cities;
    $fields['city']['input_class'] = array( 'wc-enhanced-select' );
    $fields['city']['required'] = true;
    
    // Adres alanı etiket ve placeholder
    if ( isset( $fields['address_1'] ) ) {
        $fields['address_1']['label'] = 'Adres';
        $fields['address_1']['placeholder'] = 'Adres';
        $fields['address_1']['input_class'] = array( 'form-control' );
        $fields['address_1']['class'] = array( 'form-row', 'form-row-wide', 'mb-3' );
    }

    // Eyalet (State) alanını gizle/kaldır
    if ( isset($fields['state']) ) {
        $fields['state']['required'] = false;
        $fields['state']['hidden'] = true;
    }

    return $fields;
}

// 4. Eyalet alanını ülke bazında da (TR için) zorunlu olmaktan çıkar
add_filter( 'woocommerce_get_country_locale', 'microvise_remove_state_field_for_kktc' );
function microvise_remove_state_field_for_kktc( $locale ) {
    $locale['TR']['state']['required'] = false;
    $locale['TR']['state']['hidden'] = true;
    return $locale;
}

// 5. Checkout'ta ikinci (shipping) şehir alanını kaldır
add_filter( 'woocommerce_checkout_fields', 'microvise_remove_shipping_city_field' );
function microvise_remove_shipping_city_field( $fields ) {
    if ( isset( $fields['shipping']['shipping_city'] ) ) {
        unset( $fields['shipping']['shipping_city'] );
    }
    if ( isset( $fields['shipping']['shipping_state'] ) ) {
        unset( $fields['shipping']['shipping_state'] );
    }
    return $fields;
}

add_filter( 'woocommerce_checkout_fields', 'microvise_remove_billing_postcode_state' );
function microvise_remove_billing_postcode_state( $fields ) {
    if ( isset( $fields['billing']['billing_postcode'] ) ) {
        unset( $fields['billing']['billing_postcode'] );
    }
    if ( isset( $fields['billing']['billing_state'] ) ) {
        unset( $fields['billing']['billing_state'] );
    }
    return $fields;
}

// Checkout alanlarını düzenle: isimler, firma adı, stil, ek bilgi en alta
add_filter( 'woocommerce_checkout_fields', 'microvise_customize_checkout_fields' );
function microvise_customize_checkout_fields( $fields ) {
    if ( isset( $fields['billing']['billing_first_name'] ) ) {
        $fields['billing']['billing_first_name']['label'] = 'İsim';
        $fields['billing']['billing_first_name']['input_class'] = array( 'form-control' );
        $fields['billing']['billing_first_name']['class'] = array( 'form-row', 'form-row-first', 'mb-3' );
    }
    if ( isset( $fields['billing']['billing_last_name'] ) ) {
        $fields['billing']['billing_last_name']['label'] = 'Soyisim';
        $fields['billing']['billing_last_name']['input_class'] = array( 'form-control' );
        $fields['billing']['billing_last_name']['class'] = array( 'form-row', 'form-row-last', 'mb-3' );
    }
    $fields['billing']['billing_company'] = isset( $fields['billing']['billing_company'] ) ? $fields['billing']['billing_company'] : array();
    $fields['billing']['billing_company']['label'] = 'Firma Adı';
    $fields['billing']['billing_company']['required'] = false;
    $fields['billing']['billing_company']['priority'] = 45;
    $fields['billing']['billing_company']['input_class'] = array( 'form-control' );
    $fields['billing']['billing_company']['class'] = array( 'form-row', 'form-row-wide', 'mb-3' );
    if ( isset( $fields['billing']['billing_address_1'] ) ) {
        $fields['billing']['billing_address_1']['input_class'] = array( 'form-control' );
        $fields['billing']['billing_address_1']['class'] = array( 'form-row', 'form-row-wide', 'mb-3' );
    }
    if ( isset( $fields['billing']['billing_phone'] ) ) {
        $fields['billing']['billing_phone']['required'] = true;
        $fields['billing']['billing_phone']['input_class'] = array( 'form-control' );
        $fields['billing']['billing_phone']['class'] = array( 'form-row', 'form-row-wide', 'mb-3' );
    }
    if ( isset( $fields['order']['order_comments'] ) ) {
        $fields['order']['order_comments']['priority'] = 999;
    }
    return $fields;
}

// Ek bilgi bölümünü formun en altına taşı
// Bu kodlar fatal error verdiği için kaldırıldı (function woocommerce_order_notes not found)
// remove_action( 'woocommerce_checkout_after_customer_details', 'woocommerce_order_notes', 10 );
// add_action( 'woocommerce_checkout_after_order_review', 'woocommerce_order_notes', 5 );

// Checkout sayfasından kupon formunu kaldır
remove_action( 'woocommerce_before_checkout_form', 'woocommerce_checkout_coupon_form', 10 );

// Ödeme işlemi tamamlandıktan sonra ana sayfaya yönlendir
add_action( 'woocommerce_thankyou', 'microvise_redirect_home_after_purchase' );
function microvise_redirect_home_after_purchase( $order_id ) {
    if ( ! $order_id ) {
        return;
    }
    
    // Yönlendirme
    wp_redirect( home_url() );
    exit;
}

// Checkout sayfasındaki gizlilik politikası metnini kaldır
add_filter( 'woocommerce_checkout_privacy_policy_text', '__return_empty_string' );

/**
 * Polyfill for woocommerce_order_notes if it is missing
 * This fixes the "function not found" fatal error
 */
if ( ! function_exists( 'woocommerce_order_notes' ) ) {
    function woocommerce_order_notes( $checkout ) {
        if ( ! $checkout ) {
            return;
        }
        ?>
        <div class="woocommerce-additional-fields">
            <?php do_action( 'woocommerce_before_order_notes', $checkout ); ?>

            <?php if ( apply_filters( 'woocommerce_enable_order_notes_field', 'yes' === get_option( 'woocommerce_enable_order_comments', 'yes' ) ) ) : ?>

                <h3><?php esc_html_e( 'Additional information', 'woocommerce' ); ?></h3>

                <div class="woocommerce-additional-fields__field-wrapper">
                    <?php foreach ( $checkout->get_checkout_fields( 'order' ) as $key => $field ) : ?>
                        <?php woocommerce_form_field( $key, $field, $checkout->get_value( $key ) ); ?>
                    <?php endforeach; ?>
                </div>

            <?php endif; ?>

            <?php do_action( 'woocommerce_after_order_notes', $checkout ); ?>
        </div>
        <?php
    }
}

add_filter('woocommerce_payment_gateways', 'microvise_add_halkbank_gateway');
function microvise_add_halkbank_gateway($methods) {
    $methods[] = 'Microvise_Halkbank_Gateway';
    return $methods;
}

add_action('init', 'microvise_init_halkbank_gateway');
function microvise_init_halkbank_gateway() {
    if (!class_exists('WC_Payment_Gateway')) {
        return;
    }

    if (class_exists('Microvise_Halkbank_Gateway')) {
        return;
    }

    class Microvise_Halkbank_Gateway extends WC_Payment_Gateway {
        public function __construct() {
            $this->id = 'microvise_halkbank';
            $this->icon = '';
            $this->method_title = 'Halkbank Sanal POS';
            $this->method_description = 'Halkbank sanal POS ile kredi kartı ödemesi almanızı sağlar.';
            $this->has_fields = false;
            $this->supports = array('products');

            $this->init_form_fields();
            $this->init_settings();

            $this->title = $this->get_option('title');
            $this->description = $this->get_option('description');
            $this->enabled = $this->get_option('enabled');
            $this->merchant_id = $this->get_option('merchant_id');
            $this->terminal_id = $this->get_option('terminal_id');
            $this->username = $this->get_option('username');
            $this->password = $this->get_option('password');
            $this->store_key = $this->get_option('store_key');
            $this->test_mode = $this->get_option('test_mode') === 'yes';

            add_action('woocommerce_update_options_payment_gateways_' . $this->id, array($this, 'process_admin_options'));
        }

        public function init_form_fields() {
            $this->form_fields = array(
                'enabled' => array(
                    'title' => 'Aktif/Pasif',
                    'type' => 'checkbox',
                    'label' => 'Halkbank Sanal POS ile ödemeyi etkinleştir',
                    'default' => 'no',
                ),
                'title' => array(
                    'title' => 'Ödeme Başlığı',
                    'type' => 'text',
                    'default' => 'Kredi Kartı (Halkbank Sanal POS)',
                ),
                'description' => array(
                    'title' => 'Açıklama',
                    'type' => 'textarea',
                    'default' => 'Ödemelerinizi Halkbank güvenli sanal POS altyapısı üzerinden gerçekleştirebilirsiniz.',
                ),
                'test_mode' => array(
                    'title' => 'Test Modu',
                    'type' => 'checkbox',
                    'label' => 'Test ortamını kullan',
                    'default' => 'yes',
                ),
                'merchant_id' => array(
                    'title' => 'Mağaza Numarası',
                    'type' => 'text',
                ),
                'terminal_id' => array(
                    'title' => 'Terminal Numarası',
                    'type' => 'text',
                ),
                'username' => array(
                    'title' => 'Kullanıcı Adı',
                    'type' => 'text',
                ),
                'password' => array(
                    'title' => 'Şifre',
                    'type' => 'password',
                ),
                'store_key' => array(
                    'title' => '3D Store Key',
                    'type' => 'password',
                ),
            );
        }

        public function process_payment($order_id) {
            $order = wc_get_order($order_id);

            if (!$order) {
                return array(
                    'result' => 'failure',
                );
            }

            $order->update_status('on-hold');
            $order->add_meta_data('_is_halkbank_pos_order', 'yes', true);
            $order->save();

            wc_reduce_stock_levels($order_id);
            WC()->cart->empty_cart();

            return array(
                'result' => 'success',
                'redirect' => $this->get_return_url($order),
            );
        }
    }
}
