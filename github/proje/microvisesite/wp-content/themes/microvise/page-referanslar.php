<?php
/* Template Name: Referanslar (Otomatik) */

get_header(); ?>

<div class="bg-light py-5">
    <div class="container">
        <h1 class="fw-bold text-center">Referanslarımız</h1>
        <p class="text-center text-muted">Bizi tercih eden ve birlikte büyüdüğümüz iş ortaklarımız.</p>
    </div>
</div>

<section class="py-5">
    <div class="container">
        <div class="row row-cols-2 row-cols-md-4 row-cols-lg-6 g-4 justify-content-center align-items-center">
            <?php
            // Ana resim klasörü
            $base_img_path = get_template_directory() . '/assets/img/';
            $base_img_url = get_template_directory_uri() . '/assets/img/';
            
            // Varsayılan klasör adı
            $target_folder_name = 'referans';
            $final_folder_name = $target_folder_name;
            
            // Ana klasördeki tüm alt klasörleri tara ve doğru ismi bul (Case-Insensitive)
            if (is_dir($base_img_path)) {
                $dirs = scandir($base_img_path);
                if ($dirs !== false) {
                    foreach ($dirs as $dir) {
                        if ($dir === '.' || $dir === '..') continue;
                        if (strtolower($dir) === strtolower($target_folder_name)) {
                            $final_folder_name = $dir;
                            break;
                        }
                    }
                }
            }
            
            $ref_dir_path = $base_img_path . $final_folder_name . '/';
            $ref_dir_url = $base_img_url . $final_folder_name . '/';
            
            // Klasördeki resim dosyalarını bul (Scandir yöntemi - En uyumlu)
            $images = array();
            if (is_dir($ref_dir_path)) {
                $files = scandir($ref_dir_path);
                if ($files !== false) {
                    $allowed_exts = array('png', 'jpg', 'jpeg');
                    foreach ($files as $file) {
                        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
                        if (in_array($ext, $allowed_exts)) {
                            $images[] = $ref_dir_path . $file;
                        }
                    }
                }
            } else {
                // Debug Bilgisi (Yönetici ise veya ?debug=1 varsa göster)
                if (current_user_can('administrator') || isset($_GET['debug'])) {
                    echo '<div class="alert alert-warning col-12">';
                    echo '<strong>Hata:</strong> Klasör bulunamadı.<br>';
                    echo 'Aranan Yol: ' . $ref_dir_path . '<br>';
                    echo 'Ana Klasör: ' . $base_img_path . '<br>';
                    echo 'Bulunan Klasör Adı: ' . $final_folder_name;
                    echo '</div>';
                }
            }
            
            // Dosya yollarına göre sırala (isteğe bağlı, tutarlılık için)
            if (!empty($images)) {
                sort($images);
            }
            
            if (!empty($images)) {
                foreach ($images as $image_path) {
                    $image_name = basename($image_path);
                    $image_url = $ref_dir_url . $image_name;
                    // Dosya adını referans adı olarak kullan (uzantısız)
                    $ref_name = pathinfo($image_name, PATHINFO_FILENAME);
                    // İsimdeki tireleri boşluk yap ve baş harfleri büyüt
                    $display_name = ucwords(str_replace(array('-', '_'), ' ', $ref_name));
                    ?>
                    <div class="col">
                        <div class="card h-100 border-0 shadow-sm hover-shadow transition-all">
                            <div class="card-body d-flex align-items-center justify-content-center p-4" style="height: 120px;">
                                <img src="<?php echo esc_url($image_url); ?>" 
                                     alt="<?php echo esc_attr($display_name); ?>" 
                                     title="<?php echo esc_attr($display_name); ?>"
                                     class="img-fluid" 
                                     style="max-height: 80px; filter: grayscale(100%); transition: filter 0.3s;"
                                     onmouseover="this.style.filter='grayscale(0%)'"
                                     onmouseout="this.style.filter='grayscale(100%)'">
                            </div>
                        </div>
                    </div>
                    <?php
                }
            } else {
                echo '<div class="col-12 text-center"><p class="text-muted">Henüz referans görseli eklenmemiş.</p></div>';
            }
            ?>
        </div>
    </div>
</section>

<style>
.hover-shadow:hover {
    transform: translateY(-5px);
    box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
}
.transition-all {
    transition: all 0.3s ease;
}
</style>

<?php get_footer(); ?>