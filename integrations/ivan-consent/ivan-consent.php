<?php
/**
 * Plugin Name: Iván — Cookies y privacidad
 * Description: Publicación conjunta de textos legales y Consent Mode v2 básico; Analytics exclusivamente desde GTM.
 * Version: 1.0.2
 * Requires PHP: 7.4
 */
if (!defined('ABSPATH')) { exit; }

register_activation_hook(__FILE__, function () {
    foreach (array('privacidad', 'terminos') as $slug) {
        if (!get_page_by_path($slug)) { wp_die('No se encontró la página legal: ' . esc_html($slug)); }
    }
});

// Runs only AFTER this plugin is active: the banner is available before any new
// legal text can be served. Both texts are delivered in this one release.
add_action('init', function () {
    if (get_option('ivanc_release_version') === '1.0.0') { return; }
    $records = json_decode(file_get_contents(__DIR__ . '/legal.json'), true);
    if (!is_array($records) || count($records) !== 2) { return; }
    $published = new DateTimeImmutable('now', new DateTimeZone('America/Mexico_City'));
    $iso = $published->format('Y-m-d');
    $months = array(1 => 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre');
    $display = $published->format('j') . ' de ' . $months[(int) $published->format('n')] . ' de ' . $published->format('Y');
    $snapshots = array();
    foreach ($records as $slug => $record) {
        $page = get_page_by_path($slug);
        if (!$page) { return; }
        $snapshots[$slug] = array('page' => $page, 'schema' => get_post_meta($page->ID, '_ivan_schema', true));
    }
    foreach ($records as $slug => $record) {
        $content = preg_replace('/Última actualización: [^<]+/u', 'Última actualización: ' . $display, $record['content']);
        $result = wp_update_post(wp_slash(array('ID' => $snapshots[$slug]['page']->ID, 'post_content' => $content)), true);
        if (is_wp_error($result)) {
            foreach ($snapshots as $old) {
                wp_update_post(wp_slash(array('ID' => $old['page']->ID, 'post_content' => $old['page']->post_content)));
                update_post_meta($old['page']->ID, '_ivan_schema', wp_slash($old['schema']));
            }
            return;
        }
        $schema = $record['schema'];
        $schema['dateModified'] = $iso;
        update_post_meta($result, '_ivan_schema', wp_slash('<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . '</script>'));
    }
    update_option('ivanc_release_date', $iso, false);
    update_option('ivanc_release_version', '1.0.0', false);
});

add_action('wp_head', function () {
    $base = plugin_dir_url(__FILE__) . 'assets/';
    echo '<link rel="stylesheet" href="' . esc_url($base . 'cookie-consent.css?v=3') . '">';
    // Synchronous: establishes denied defaults before any Google library.
    echo '<script src="' . esc_url($base . 'cookie-consent.js?v=2') . '"></script>';
}, -100);

add_action('template_redirect', function () {
    if (is_feed() || is_robots() || is_trackback()) { return; }
    ob_start(function ($html) {
        // Retire only the exact legacy container snippet installed previously.
        // This makes the release safe even when the existing theme is updated.
        $html = preg_replace('~<script\\b[^>]*src=["\']https://www\\.googletagmanager\\.com/gtm\\.js\\?id=GTM-MQMHWNXK["\'][^>]*>\\s*</script>~i', '', $html);
        $html = preg_replace('~(*UCP)<script>\\s*window\\.dataLayer\\s*=\\s*window\\.dataLayer\\s*\\|\\|\\s*\\[\\];\\s*function\\s+gtag\\(\\)\\{dataLayer\\.push\\(arguments\\);\\}\\s*gtag\\(["\']js["\'],\\s*new Date\\(\\)\\);\\s*</script>~u', '', $html);
        if (strpos($html, 'data-cookie-preferences') === false) {
            $html = preg_replace('~(<nav class="foot-legal"[^>]*>.*?)(</nav>)~s', '$1<a href="#preferencias-cookies" data-cookie-preferences>Preferencias de cookies</a>$2', $html, 1);
        }
        return $html;
    });
}, 0);
