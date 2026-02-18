<?php
/**
 * WooCommerce Sayfaları için Şablon
 */
get_header(); ?>

<?php if ( ! ( function_exists('is_checkout') && is_checkout() ) ) : ?>
    <div class="bg-light py-5">
        <div class="container">
            <h1 class="fw-bold text-center">
                <?php if (is_shop()) { echo 'Ürünler'; } 
                      elseif (is_product_category()) { single_term_title(); } 
                      elseif (is_product()) { the_title(); } 
                      else { echo 'Mağaza'; } ?>
            </h1>
            <p class="text-center text-muted lead">İşletmenizin ihtiyaçlarına uygun, güvenilir ve yeni nesil çözümler.</p>
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb justify-content-center">
                    <li class="breadcrumb-item"><a href="<?php echo home_url(); ?>">Ana Sayfa</a></li>
                    <li class="breadcrumb-item active" aria-current="page">
                        <?php if (is_shop()) { echo 'Ürünler'; } 
                              elseif (is_product_category()) { single_term_title(); } 
                              elseif (is_product()) { the_title(); } 
                              else { echo 'Mağaza'; } ?>
                    </li>
                </ol>
            </nav>
        </div>
    </div>
<?php endif; ?>

<section class="py-5">
    <div class="<?php echo ( function_exists('is_checkout') && is_checkout() ) ? 'container-fluid' : 'container'; ?>">
        <?php woocommerce_content(); ?>
    </div>
</section>

<?php get_footer(); ?>
