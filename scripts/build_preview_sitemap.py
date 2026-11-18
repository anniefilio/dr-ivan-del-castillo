#!/usr/bin/env python3
"""Build only the static preview sitemap. Production uses the WordPress plugin."""
from pathlib import Path
from html.parser import HTMLParser
import argparse
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
NS = 'http://www.sitemaps.org/schemas/sitemap/0.9'

class Metadata(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonical, self.noindex = None, False
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'meta' and a.get('name', '').lower() in ('robots', 'googlebot'):
            self.noindex |= 'noindex' in a.get('content', '').lower()
        if tag == 'link' and 'canonical' in a.get('rel', '').split():
            self.canonical = a.get('href')

def build():
    ET.register_namespace('', NS)
    root = ET.Element('{' + NS + '}urlset')
    urls = set()
    for file in sorted(ROOT.rglob('index.html')):
        if any(part.startswith('.') or part in ('borradores', 'wordpress', 'tests') for part in file.relative_to(ROOT).parts):
            continue
        meta = Metadata()
        meta.feed(file.read_text())
        if not meta.noindex and meta.canonical:
            urls.add(meta.canonical)
    for url in sorted(urls):
        entry = ET.SubElement(root, '{' + NS + '}url')
        ET.SubElement(entry, '{' + NS + '}loc').text = url
    return ET.tostring(root, encoding='unicode', xml_declaration=True) + '\n'

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    expected = build()
    target = ROOT / 'sitemap.xml'
    if args.check:
        if target.read_text() != expected:
            raise SystemExit('Preview sitemap is stale. Run python3 scripts/build_preview_sitemap.py')
    else:
        target.write_text(expected)
