<?php
/**
 * The main template file
 */

get_header();
?>

<div class="container py-5">
    <?php
    if ( have_posts() ) :
        while ( have_posts() ) :
            the_post();
            ?>
            <article id="post-<?php the_ID(); ?>" <?php post_class('mb-5'); ?>>
                <header class="entry-header mb-3">
                    <?php the_title( '<h1 class="entry-title fw-bold">', '</h1>' ); ?>
                </header>

                <div class="entry-content">
                    <?php
                    the_content();

                    wp_link_pages( array(
                        'before' => '<div class="page-links">' . esc_html__( 'Pages:', 'microvise' ),
                        'after'  => '</div>',
                    ) );
                    ?>
                </div>
            </article>
            <?php
        endwhile;
    else :
        ?>
        <p><?php esc_html_e( 'İçerik bulunamadı.', 'microvise' ); ?></p>
        <?php
    endif;
    ?>
</div>

<?php
get_footer();
