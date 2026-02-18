<?php
/**
 * Template Name: Cart
 *
 * This template forces the classic WooCommerce Cart shortcode
 * to avoid issues with WooCommerce Blocks in some environments.
 */

get_header(); ?>

<div class="container py-5">
    <div class="row">
        <div class="col-12">
            <h1 class="mb-4"><?php the_title(); ?></h1>
            <div class="woocommerce-cart-wrapper">
                <?php echo do_shortcode('[woocommerce_cart]'); ?>
            </div>
        </div>
    </div>
</div>

<?php get_footer(); ?>
