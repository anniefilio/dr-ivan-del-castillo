import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

def load(name):
    path = Path(__file__).resolve().parents[1] / 'scripts' / (name + '.py')
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

audit = load('audit_sitemap')
preview = load('build_preview_sitemap')
ORIGIN = 'https://drcolumnavertebral.com'

class SitemapTests(unittest.TestCase):
    def test_preview_noindex_is_preserved(self):
        self.assertNotIn('<loc>', preview.build())

    def test_noncanonical_urls_are_rejected(self):
        for url in ('/blog/', ORIGIN + '/?utm_source=test', 'https://example.com/', ORIGIN + '/#top'):
            with self.assertRaises(ValueError):
                audit.validate_url(url, ORIGIN)

    def test_recursive_index_and_real_lastmod(self):
        index = b'<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>https://drcolumnavertebral.com/posts.xml</loc></sitemap></sitemapindex>'
        child = b'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://drcolumnavertebral.com/blog/</loc><lastmod>2025-01-01T00:00:00+00:00</lastmod></url></urlset>'
        with patch.object(audit, 'fetch', side_effect=[(200, {'content-type': 'text/xml'}, index), (200, {'content-type': 'text/xml'}, child)]):
            self.assertEqual(audit.read_sitemap(ORIGIN + '/sitemap.xml', ORIGIN), [{'url': ORIGIN + '/blog/', 'lastmod': '2025-01-01T00:00:00+00:00'}])

    def test_html_and_header_noindex_are_detected(self):
        for headers, body in [({'x-robots-tag': 'noindex'}, '<link rel="canonical" href="' + ORIGIN + '/">'), ({}, '<meta name="robots" content="noindex"><link rel="canonical" href="' + ORIGIN + '/">')]:
            with patch.object(audit, 'fetch', return_value=(200, headers, body.encode())):
                self.assertIn('noindex', audit.check_page({'url': ORIGIN + '/'})['errors'])

    def test_redirect_and_wrong_canonical_are_detected(self):
        with patch.object(audit, 'fetch', return_value=(301, {}, b'')):
            result = audit.check_page({'url': ORIGIN + '/'})
            self.assertIn('HTTP 301', result['errors'])
            self.assertTrue(any('Canonical mismatch' in e for e in result['errors']))

    def test_future_lastmod_is_rejected(self):
        xml = b'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://drcolumnavertebral.com/</loc><lastmod>2999-01-01</lastmod></url></urlset>'
        with patch.object(audit, 'fetch', return_value=(200, {'content-type': 'application/xml'}, xml)):
            with self.assertRaisesRegex(ValueError, 'Future lastmod'):
                audit.read_sitemap(ORIGIN + '/sitemap.xml', ORIGIN)

    def test_index_cycles_are_rejected(self):
        xml = b'<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>https://drcolumnavertebral.com/sitemap.xml</loc></sitemap></sitemapindex>'
        with patch.object(audit, 'fetch', return_value=(200, {'content-type': 'text/xml'}, xml)):
            with self.assertRaisesRegex(ValueError, 'cyclic'):
                audit.read_sitemap(ORIGIN + '/sitemap.xml', ORIGIN)

if __name__ == '__main__':
    unittest.main()
