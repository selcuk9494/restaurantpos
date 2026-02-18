<?php
/**
 * Template Name: Checkout
 *
 * This template forces the classic WooCommerce Checkout shortcode
 * to avoid issues with WooCommerce Blocks in some environments.
 */

get_header(); ?>

<div class="container-fluid py-5">
    <div class="row">
        <div class="col-12">
            <h1 class="mb-4"><?php the_title(); ?></h1>
            <div class="woocommerce-checkout-wrapper">
                <?php echo do_shortcode('[woocommerce_checkout]'); ?>
            </div>
        </div>
    </div>
</div>

<?php get_footer(); ?>
