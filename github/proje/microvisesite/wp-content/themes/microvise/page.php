<?php
/**
 * The template for displaying all pages
 */

get_header(); ?>

<div class="container py-5">
    <div class="row">
        <div class="col-12">
            <?php
            while ( have_posts() ) :
                the_post();
                ?>
                <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
                    <header class="entry-header mb-4">
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
            ?>
        </div>
    </div>
</div>

<?php get_footer(); ?>
