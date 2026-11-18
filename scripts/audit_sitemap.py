#!/usr/bin/env python3
"""Validate a live sitemap recursively, then audit every listed public HTML URL."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
from pathlib import Path
import subprocess
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

NS = '{http://www.sitemaps.org/schemas/sitemap/0.9}'

class SEO(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonicals, self.robots = [], []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'link' and 'canonical' in a.get('rel', '').lower().split():
            self.canonicals.append(a.get('href', ''))
        if tag == 'meta' and a.get('name', '').lower() in ('robots', 'googlebot'):
            self.robots.append(a.get('content', '').lower())

def fetch(url):
    # Do not follow redirects: their presence is a validation failure.
    p = subprocess.run(['curl', '--silent', '--show-error', '--max-time', '30',
                        '--include', url], capture_output=True, check=True)
    header, sep, body = p.stdout.partition(b'\r\n\r\n')
    if not sep:
        raise ValueError('Missing HTTP headers: ' + url)
    lines = header.decode('utf-8', 'replace').splitlines()
    status = int(lines[0].split()[1])
    headers = dict(line.lower().split(':', 1) for line in lines[1:] if ':' in line)
    return status, headers, body

def read_sitemap(url, origin, seen=None):
    seen = set() if seen is None else seen
    if url in seen:
        raise ValueError('Duplicate/cyclic sitemap: ' + url)
    seen.add(url)
    status, headers, body = fetch(url)
    if status != 200:
        raise ValueError(f'Sitemap HTTP {status}: {url}')
    if len(body) > 50 * 1024 * 1024:
        raise ValueError('Sitemap exceeds 50 MB')
    if 'xml' not in headers.get('content-type', ''):
        raise ValueError('Sitemap does not have XML content type: ' + url)
    root = ET.fromstring(body)
    if root.tag == NS + 'sitemapindex':
        children = root.findall(NS + 'sitemap')
        if len(children) > 50000:
            raise ValueError('Index exceeds 50,000 entries')
        result = []
        for child in children:
            loc = child.findtext(NS + 'loc')
            validate_url(loc, origin)
            result.extend(read_sitemap(loc, origin, seen))
        return result
    if root.tag != NS + 'urlset':
        raise ValueError('Unexpected XML root: ' + root.tag)
    entries = root.findall(NS + 'url')
    if len(entries) > 50000:
        raise ValueError('Sitemap exceeds 50,000 URLs')
    result = []
    for entry in entries:
        loc = entry.findtext(NS + 'loc')
        validate_url(loc, origin)
        lastmod = entry.findtext(NS + 'lastmod')
        if lastmod:
            date = datetime.fromisoformat(lastmod.replace('Z', '+00:00'))
            if date.tzinfo is None:
                date = date.replace(tzinfo=timezone.utc)
            if date > datetime.now(timezone.utc):
                raise ValueError('Future lastmod: ' + loc)
        if entry.find(NS + 'priority') is not None or entry.find(NS + 'changefreq') is not None:
            raise ValueError('Unnecessary priority/changefreq: ' + loc)
        result.append({'url': loc, 'lastmod': lastmod})
    return result

def validate_url(url, origin):
    u, expected = urlsplit(url or ''), urlsplit(origin)
    if (u.scheme, u.netloc) != (expected.scheme, expected.netloc) or u.query or u.fragment:
        raise ValueError('Noncanonical/relative/tracking URL: ' + str(url))

def check_page(entry):
    url = entry['url']
    try:
        status, headers, body = fetch(url)
        seo = SEO()
        seo.feed(body.decode('utf-8', 'replace'))
        errors = []
        if status != 200:
            errors.append('HTTP ' + str(status))
        if seo.canonicals != [url]:
            errors.append('Canonical mismatch: ' + repr(seo.canonicals))
        if 'noindex' in ','.join(seo.robots) + headers.get('x-robots-tag', ''):
            errors.append('noindex')
        return dict(entry, status=status, errors=errors)
    except Exception as exc:
        return dict(entry, errors=[str(exc)])

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--origin', default='https://drcolumnavertebral.com')
    parser.add_argument('--sitemap', default='/sitemap.xml')
    parser.add_argument('--output', default='/private/tmp/ivan-sitemap-validation.json')
    args = parser.parse_args()
    entries = read_sitemap(args.origin + args.sitemap, args.origin)
    urls = [e['url'] for e in entries]
    if len(urls) != len(set(urls)):
        raise ValueError('Duplicate page URLs')
    with ThreadPoolExecutor(max_workers=5) as pool:
        pages = list(pool.map(check_page, entries))
    status, _, body = fetch(args.origin + '/robots.txt')
    robots_ok = status == 200 and ('Sitemap: ' + args.origin + args.sitemap) in body.decode()
    paths = [urlsplit(u).path for u in urls]
    summary = {
        'sitemap': args.origin + args.sitemap, 'total': len(urls),
        'blog_articles': sum(p.startswith('/blog/') and p != '/blog/' for p in paths),
        'condition_pages': sum(p.startswith('/columna/') and p != '/columna/' for p in paths),
        'treatment_pages': sum(p.startswith('/procedimientos/') and p != '/procedimientos/' for p in paths),
        'academic_articles': sum(p.startswith('/noticias/') and p != '/noticias/' for p in paths),
        'robots_reference_ok': robots_ok,
        'errors': [p for p in pages if p['errors']],
    }
    Path(args.output).write_text(json.dumps({'summary': summary, 'pages': pages}, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    raise SystemExit(1 if summary['errors'] or not robots_ok else 0)

if __name__ == '__main__':
    main()
