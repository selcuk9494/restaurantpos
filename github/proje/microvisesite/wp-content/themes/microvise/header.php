<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    
    <?php if ( is_front_page() ) : ?>
    <title>KKTC Yazar Kasa POS Sistemleri - Lefkoşa, Girne, Mağusa | Microvise</title>
    <meta name="description" content="Microvise, KKTC genelinde (Lefkoşa, Girne, Gazimağusa, Lefke, Güzelyurt) yeni nesil yazar kasa POS cihazları satışı, kurulumu ve teknik destek hizmeti sunmaktadır.">
    <meta name="keywords" content="kktc yazar kasa, kıbrıs pos cihazı, lefkoşa yazar kasa, girne pos sistemleri, gazimağusa yazar kasa, lefke pos, güzelyurt yazar kasa, microvise">
    
    <!-- LocalBusiness Schema -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Microvise Innovation",
      "image": "<?php echo get_template_directory_uri(); ?>/assets/img/logo.png",
      "@id": "<?php echo home_url(); ?>",
      "url": "<?php echo home_url(); ?>",
      "telephone": "+905488519494",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Atatürk Cad Emek2 No:1",
        "addressLocality": "Yenişehir, Lefkoşa",
        "addressCountry": "KKTC"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 35.19008199675299,
        "longitude": 33.35712396779412
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday"
        ],
        "opens": "08:30",
        "closes": "18:00"
      },
      "areaServed": ["Lefkoşa", "Girne", "Gazimağusa", "Lefke", "Güzelyurt", "İskele"],
      "priceRange": "₺₺"
    }
    </script>
    <?php endif; ?>

    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>

<?php if ( ! ( ( function_exists('is_checkout') && is_checkout() && !empty( is_wc_endpoint_url('order-received') ) ) || ( function_exists('microvise_is_halkbank_order_page') && microvise_is_halkbank_order_page() ) ) ) : ?>
<nav class="navbar navbar-expand-lg navbar-light bg-white sticky-top shadow-sm py-3">
    <div class="container-fluid">
        <a class="navbar-brand d-flex align-items-center" href="<?php echo home_url(); ?>">
            <?php
            if ( has_custom_logo() ) {
                the_custom_logo();
            } else {
                echo '<i class="fas fa-cash-register me-2 text-primary"></i> Microvise';
            }
            ?>
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse justify-content-end" id="navbarNav">
            <ul class="navbar-nav align-items-center">
                <li class="nav-item">
                    <a class="nav-link" href="<?php echo home_url(); ?>">Ana Sayfa</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="<?php echo home_url('/urunler'); ?>">Ürünler</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="<?php echo home_url('/servis-destek'); ?>">Servis & Destek</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="<?php echo home_url('/hakkimizda'); ?>">Hakkımızda</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="<?php echo home_url('/iletisim'); ?>">İletişim</a>
                </li>
                <li class="nav-item ms-lg-3">
                    <a href="https://wa.me/905488519494?text=Merhaba, teklif almak istiyorum." class="btn btn-custom" target="_blank">
                        <i class="fab fa-whatsapp me-2"></i> Teklif Al
                    </a>
                </li>
            </ul>
        </div>
    </div>
</nav>
<?php endif; ?>
