<?php
/**
 * Plugin Name: Iván — Sitemap automático
 * Description: Sitemap nativo de WordPress en /sitemap.xml, con exclusiones y fechas reales.
 * Version: 1.0.0
 * Requires at least: 6.4
 * Requires PHP: 7.4
 */
if (!defined('ABSPATH')) { exit; }

function ivansm_excluded_routes() {
    return array('sample-page', 'hello-world', 'primera-consulta/gracias', 'doctor/equipo');
}

function ivansm_excluded_ids() {
    $ids = array();
    foreach (ivansm_excluded_routes() as $route) {
        $post = get_page_by_path($route, OBJECT, array('page', 'post'));
        if ($post) { $ids[] = $post->ID; }
    }
    // Only inspect the small set of records that actually declares a canonical
    // override or redirect. A self-referencing custom canonical remains eligible.
    $keys = array('_ivan_canonical', '_yoast_wpseo_canonical', 'rank_math_canonical_url', '_seopress_robots_canonical', '_ivan_redirect');
    $meta = array('relation' => 'OR');
    foreach ($keys as $key) { $meta[] = array('key' => $key, 'value' => '', 'compare' => '!='); }
    $overrides = get_posts(array('post_type' => 'any', 'post_status' => 'publish', 'numberposts' => -1, 'meta_query' => $meta));
    foreach ($overrides as $post) {
        $url = untrailingslashit(get_permalink($post));
        foreach ($keys as $key) {
            $value = get_post_meta($post->ID, $key, true);
            if ($value && ($key === '_ivan_redirect' || untrailingslashit($value) !== $url)) { $ids[] = $post->ID; break; }
        }
    }
    return $ids;
}

function ivansm_query($args) {
    $args['post_status'] = array('publish');
    $args['has_password'] = false;
    $args['post__not_in'] = array_values(array_unique(array_merge(
        isset($args['post__not_in']) ? $args['post__not_in'] : array(), ivansm_excluded_ids()
    )));
    // Apply the same exclusions to the URL query AND native pagination/count query.
    $meta = isset($args['meta_query']) ? array($args['meta_query']) : array();
    foreach (array('_ivan_noindex', '_ivan_sitemap_exclude', '_yoast_wpseo_meta-robots-noindex', '_seopress_robots_index') as $key) {
        $meta[] = array('relation' => 'OR',
            array('key' => $key, 'compare' => 'NOT EXISTS'),
            array('key' => $key, 'value' => array('1', 'yes'), 'compare' => 'NOT IN')
        );
    }
    $meta[] = array('relation' => 'OR',
        array('key' => 'rank_math_robots', 'compare' => 'NOT EXISTS'),
        array('key' => 'rank_math_robots', 'value' => '"noindex"', 'compare' => 'NOT LIKE')
    );
    $args['meta_query'] = array_merge(array('relation' => 'AND'), $meta);
    return $args;
}
add_filter('wp_sitemaps_posts_query_args', 'ivansm_query');

// This site publishes its articles as Pages as well as future native Posts.
// Keep all public, viewable singular post types supplied by WordPress.
add_filter('wp_sitemaps_add_provider', function ($provider, $name) {
    return in_array($name, array('users', 'taxonomies'), true) ? false : $provider;
}, 10, 2);
add_filter('wp_sitemaps_max_urls', function ($max) { return min(500, $max); });

add_filter('wp_sitemaps_posts_entry', function ($entry, $post) {
    unset($entry['lastmod'], $entry['priority'], $entry['changefreq']);
    // Database modification time; never the time of deployment or sitemap request.
    $date = get_post_meta($post->ID, '_ivan_sitemap_lastmod_gmt', true) ?: $post->post_modified_gmt;
    if ($date && $date !== '0000-00-00 00:00:00') {
        $time = strtotime($date . ' UTC');
        if ($time !== false && $time <= time()) { $entry['lastmod'] = gmdate('c', $time); }
    }
    return $entry;
}, 10, 2);

// Re-saving or synchronizing identical content must not advance lastmod.
add_action('post_updated', function ($id, $after, $before) {
    $changed = false;
    foreach (array('post_title', 'post_content', 'post_excerpt') as $field) {
        if ($after->$field !== $before->$field) { $changed = true; break; }
    }
    $previous = get_post_meta($id, '_ivan_sitemap_lastmod_gmt', true) ?: $before->post_modified_gmt;
    update_post_meta($id, '_ivan_sitemap_lastmod_gmt', $changed ? $after->post_modified_gmt : $previous);
}, 10, 3);

// Keep this policy's canonical overrides consistent with HTML canonical output.
add_filter('get_canonical_url', function ($canonical, $post) {
    $custom = get_post_meta($post->ID, '_ivan_canonical', true);
    return $custom ? esc_url_raw($custom) : $canonical;
}, 10, 2);

function ivansm_rewrite() {
    add_rewrite_rule('^sitemap\\.xml$', 'index.php?sitemap=index', 'top');
}
add_action('init', 'ivansm_rewrite');
register_activation_hook(__FILE__, function () { ivansm_rewrite(); flush_rewrite_rules(false); });
register_deactivation_hook(__FILE__, function () { flush_rewrite_rules(false); });

// Serve /sitemap.xml directly, without a redirect or a dependency on rewrite flushing.
add_action('parse_request', function ($wp) {
    if ($wp->request === 'sitemap.xml') { $wp->query_vars = array('sitemap' => 'index'); }
});
add_filter('home_url', function ($url, $path) {
    return $path === '/wp-sitemap.xml' ? str_replace('/wp-sitemap.xml', '/sitemap.xml', $url) : $url;
}, 10, 2);
add_filter('robots_txt', function ($output, $public) {
    if (!$public) { return $output; }
    $output = preg_replace('~^Sitemap:\\s*https?://[^\\r\\n]+/(?:wp-)?sitemap\\.xml\\s*$~mi', '', $output);
    return rtrim($output) . "\n\nSitemap: " . home_url('/sitemap.xml') . "\n";
}, 20, 2);

// Sitemaps must reflect current publication state, not a month-old page cache.
add_action('parse_request', function ($wp) {
    if (isset($wp->query_vars['sitemap'])) {
        if (!defined('DONOTCACHEPAGE')) { define('DONOTCACHEPAGE', true); }
        nocache_headers();
    }
}, 20);

add_filter('wp_robots', function ($robots) {
    if (is_singular()) {
        $post = get_queried_object();
        if ($post && (in_array($post->ID, ivansm_excluded_ids(), true) || get_post_meta($post->ID, '_ivan_noindex', true))) {
            $robots['noindex'] = true;
            unset($robots['index']);
        }
    }
    return $robots;
});

// Editors can opt a future page out using WordPress's existing Custom Fields UI:
// _ivan_noindex = 1 (also emits noindex), or _ivan_sitemap_exclude = 1.
