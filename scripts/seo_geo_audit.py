#!/usr/bin/env python3
"""Auditoría SEO + GEO del sitio del Dr. Iván del Castillo (flujo medical-seo-geo).

Solo usa la biblioteca estándar de Python. Lee las páginas publicadas (o una sola URL)
y genera un JSON con lo que encontró en cada una.

Uso:
  python3 scripts/seo_geo_audit.py                      # todo el sitio (sitemap de WordPress)
  python3 scripts/seo_geo_audit.py URL [URL ...]        # páginas sueltas
  python3 scripts/seo_geo_audit.py --crawlers           # acceso de rastreadores (robots.txt + HTTP)
  Opciones: --out archivo.json  --base https://drcolumnavertebral.com

La lógica de citabilidad se adaptó de geo-seo-claude (scripts/citability_scorer.py, licencia MIT),
reescrita para español y contenido médico. Es una métrica interna de diagnóstico:
no es una medición de Google, ChatGPT ni de ningún buscador.
"""
import json
import re
import sys
import urllib.request
import urllib.robotparser
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse

BASE = "https://drcolumnavertebral.com"
UA = "Mozilla/5.0 (compatible; medical-seo-geo-audit/1.0)"

# Rastreadores y para qué sirve cada uno (según la documentación de cada empresa).
CRAWLERS = {
    "Googlebot": "Buscador de Google (incluye AI Overviews y AI Mode)",
    "Bingbot": "Buscador de Bing (también alimenta Copilot y parte de ChatGPT Search)",
    "OAI-SearchBot": "Resultados de búsqueda de ChatGPT; no se usa para entrenar",
    "ChatGPT-User": "Visitas que pide una persona desde ChatGPT",
    "GPTBot": "Entrenamiento de modelos de OpenAI",
    "ClaudeBot": "Entrenamiento de modelos de Anthropic",
    "Claude-SearchBot": "Resultados de búsqueda de Claude",
    "Claude-User": "Visitas que pide una persona desde Claude",
    "PerplexityBot": "Índice de búsqueda de Perplexity",
    "Google-Extended": "Control de uso en Gemini (no afecta Google Search)",
    "Applebot-Extended": "Control de uso en Apple Intelligence",
    "CCBot": "Common Crawl (conjuntos de datos públicos)",
}


def fetch(url, ua=UA):
    req = urllib.request.Request(url, headers={"User-Agent": ua})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read().decode("utf-8", "replace"), dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace"), dict(e.headers)


class Page(HTMLParser):
    SKIP = {"script", "style", "noscript", "svg", "template"}
    BLOCK = {"p", "li", "td", "th", "h1", "h2", "h3", "h4", "caption", "summary", "dd", "dt"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.meta, self.links, self.ldjson, self.imgs = {}, [], [], []
        self.title = ""
        self.headings = []          # (nivel, texto)
        self.blocks = []            # (etiqueta, texto, encabezado actual, dentro de main)
        self.tables = []            # dict por tabla
        self.details = []           # clases de <details>
        self.main_class = None
        self.stack, self._buf, self._in_ld, self._ld = [], [], False, []
        self._skip = 0
        self._in_title = False
        self._cur_h = ""
        self._in_main = False
        self._table = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in self.SKIP:
            if tag == "script" and a.get("type") == "application/ld+json":
                self._in_ld, self._ld = True, []
            self._skip += 1
            return
        if tag == "title":
            self._in_title = True
        elif tag == "meta":
            k = a.get("name") or a.get("property")
            if k:
                self.meta[k.lower()] = a.get("content", "")
        elif tag == "link" and a.get("rel"):
            self.meta["link:" + a["rel"].lower()] = a.get("href", "")
        elif tag == "a" and a.get("href"):
            self.links.append((a["href"], a.get("target"), a.get("rel")))
        elif tag == "img":
            self.imgs.append(a)
        elif tag == "main":
            self._in_main = True
            self.main_class = a.get("class")
        elif tag == "details":
            self.details.append(a.get("class", ""))
        elif tag == "table":
            self._table = {"caption": "", "th_scope": 0, "thead": False, "rows": 0, "class": a.get("class", "")}
        elif self._table is not None:
            if tag == "thead":
                self._table["thead"] = True
            elif tag == "tr":
                self._table["rows"] += 1
            elif tag == "th" and a.get("scope"):
                self._table["th_scope"] += 1
        if tag in self.BLOCK or tag in ("h1", "h2", "h3", "h4"):
            self.stack.append(tag)
            self._buf = []

    def handle_endtag(self, tag):
        if tag in self.SKIP:
            self._skip = max(0, self._skip - 1)
            if self._in_ld and tag == "script":
                self.ldjson.append("".join(self._ld))
                self._in_ld = False
            return
        if tag == "title":
            self._in_title = False
        elif tag == "main":
            self._in_main = False
        elif tag == "table" and self._table is not None:
            self.tables.append(self._table)
            self._table = None
        if self.stack and self.stack[-1] == tag:
            self.stack.pop()
            text = re.sub(r"\s+", " ", "".join(self._buf)).strip()
            if tag in ("h1", "h2", "h3", "h4"):
                self.headings.append((int(tag[1]), text))
                self._cur_h = text
            elif tag == "caption" and self._table is not None:
                self._table["caption"] = text
            if text:
                self.blocks.append((tag, text, self._cur_h, self._in_main))
            self._buf = []

    def handle_data(self, data):
        if self._in_ld:
            self._ld.append(data)
            return
        if self._skip:
            return
        if self._in_title:
            self.title += data
        if self.stack:
            self._buf.append(data)


def ld_types(raw_list):
    types, ids, errors = [], [], []
    def walk(o):
        if isinstance(o, dict):
            t = o.get("@type")
            if t:
                types.extend(t if isinstance(t, list) else [t])
            if "@id" in o and "@type" in o:
                ids.append(o["@id"])
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)
    for raw in raw_list:
        try:
            walk(json.loads(raw))
        except json.JSONDecodeError as e:
            errors.append(str(e))
    return types, ids, errors


# ---------- Citabilidad (adaptada a español) ----------
DEF = re.compile(r"\b(es|son|consiste en|se refiere a|significa|se define como|se llama)\b", re.I)
PRON = re.compile(r"\b(esto|eso|esta|este|estas|estos|ello|lo anterior|aquí)\b", re.I)
NUM = re.compile(r"\b\d+(?:[.,]\d+)?\s*(?:%|años|semanas|meses|días|horas|mm|cm|por ciento)")
SRC = re.compile(r"\b(según|de acuerdo con|guía|estudio|revisión|AAOS|NHS|MedlinePlus|NICE|NASS|OMS|Cochrane)\b", re.I)


def score_passage(text, heading):
    w = text.split()
    n = len(w)
    s = 0
    # 1. Respuesta directa (30)
    a = 0
    if DEF.search(" ".join(w[:40])):
        a += 15
    if heading.endswith("?"):
        a += 10
    sents = [x for x in re.split(r"[.!?]+", text) if x.strip()]
    if sents:
        a += int(5 * sum(1 for x in sents if 5 <= len(x.split()) <= 25) / len(sents))
    s += min(a, 30)
    # 2. Autonomía (25): largo útil y pocas referencias a "esto/eso"
    b = 12 if 40 <= n <= 170 else 7 if 25 <= n <= 250 else 2
    pr = len(PRON.findall(text)) / max(n, 1)
    b += 8 if pr < 0.02 else 4 if pr < 0.04 else 0
    b += 5 if re.search(r"\b(columna|disco|nervio|médula|vértebra|cirugía|resonancia)\w*", text, re.I) else 0
    s += min(b, 25)
    # 3. Legibilidad (20)
    avg = n / max(len(sents), 1)
    s += 12 if 8 <= avg <= 20 else 6 if avg <= 28 else 2
    s += 8 if n >= 15 else 3
    # 4. Datos y fuentes (15)
    s += min(len(NUM.findall(text)) * 4, 8) + (7 if SRC.search(text) else 0)
    # 5. Señales propias (10)
    s += 10 if re.search(r"\b(en consulta|el Dr\.|en la práctica|por ejemplo)\b", text, re.I) else 0
    return min(s, 100)


def citability(blocks):
    secs, cur, buf = [], None, []
    for tag, text, h, in_main in blocks:
        if not in_main:
            continue
        if tag in ("h2", "h3"):
            if buf:
                secs.append((cur or "", " ".join(buf)))
            cur, buf = text, []
        elif tag in ("p", "li", "td", "th", "dd"):
            buf.append(text)
    if buf:
        secs.append((cur or "", " ".join(buf)))
    secs = [(h, t) for h, t in secs if len(t.split()) >= 20]
    scores = sorted((score_passage(t, h) for h, t in secs), reverse=True)
    top = scores[:5]
    return round(sum(top) / len(top)) if top else 0, len(secs)


def page_type(path):
    if path in ("/", ""):
        return "Inicio"
    seg = path.strip("/").split("/")
    if seg[0] == "blog":
        return "Blog (índice)" if len(seg) == 1 else "Artículo"
    if seg[0] == "columna":
        return "Patología" if len(seg) > 1 else "Patologías (índice)"
    if seg[0] == "procedimientos":
        return "Procedimiento" if len(seg) > 1 else "Procedimientos (índice)"
    if seg[0] == "noticias":
        return "Opinión académica" if len(seg) > 1 else "Académico (índice)"
    if seg[0] in ("videos",):
        return "Videos"
    if seg[0] in ("perfil-profesional", "doctor"):
        return "Perfil"
    if seg[0] in ("primera-consulta", "segunda-opinion", "contacto", "rehabilitacion", "atencion"):
        return "Servicio / contacto"
    return "Legal / editorial"


MEDICAL = {"Artículo", "Patología", "Procedimiento", "Opinión académica"}


def audit_html(url, status, html, headers):
    p = Page()
    p.feed(html)
    path = urlparse(url).path
    typ = page_type(path)
    types, ids, ld_err = ld_types(p.ldjson)
    main_text = " ".join(t for tag, t, h, m in p.blocks if m)
    words = len(main_text.split())
    h1 = [t for lvl, t in p.headings if lvl == 1]
    host = urlparse(BASE).netloc
    internal = [h for h, tg, rel in p.links if h.startswith("/") or urlparse(h).netloc in (host, "www." + host)]
    blank_internal = [h for h, tg, rel in p.links if tg == "_blank" and (h.startswith("/") or urlparse(h).netloc in (host, "www." + host))]
    first_p = next((t for tag, t, h, m in p.blocks if m and tag == "p" and len(t.split()) >= 12), "")
    cit, nsec = citability(p.blocks)
    canon = p.meta.get("link:canonical", "")
    robots = p.meta.get("robots", "")
    issues = []
    tl = len(p.title.strip())
    dl = len(p.meta.get("description", ""))
    if not p.title.strip():
        issues.append("sin title")
    elif tl > 65:
        issues.append(f"title largo ({tl})")
    if not dl:
        issues.append("sin meta description")
    elif dl > 165 or dl < 70:
        issues.append(f"description de {dl} caracteres")
    if len(h1) != 1:
        issues.append(f"{len(h1)} H1")
    if canon.rstrip("/") != url.rstrip("/"):
        issues.append(f"canonical distinto: {canon}")
    if "noindex" in robots:
        issues.append("noindex")
    if ld_err:
        issues.append("JSON-LD inválido")
    if not p.meta.get("og:title"):
        issues.append("sin og:title")
    if not p.meta.get("og:image"):
        issues.append("sin og:image")
    if blank_internal:
        issues.append(f"{len(blank_internal)} enlaces internos en pestaña nueva")
    if [h for h, tg, rel in p.links if "/#" in h]:
        issues.append("enlaces con /#")
    noalt = [i.get("src", "") for i in p.imgs if i.get("alt") is None]
    if noalt:
        issues.append(f"{len(noalt)} imágenes sin alt")
    is_med = typ in MEDICAL
    reviewed = any(x in html for x in ("Revisado por el Dr. Iván del Castillo Vergara", "Autoría del Dr. Iván del Castillo Vergara"))
    disclaimer = any("medical-disclaimer" in c for c in p.details)
    cta = "¿Quieres revisar tu caso con el Dr. Iván?" in html and "Solicitar primera consulta" in html
    has_faq = any("pregunta" in t.lower() for lvl, t in p.headings)
    has_sources = any("fuente" in t.lower() or "referencia" in t.lower() for lvl, t in p.headings)
    has_date = bool(re.search(r"\b\d{1,2} de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) de 20\d\d", main_text))
    if is_med:
        if not reviewed:
            issues.append("sin «Revisado por el Dr.»")
        if not disclaimer:
            issues.append("sin aviso médico desplegable")
    if not cta and status == 200 and typ != "Legal / editorial":
        issues.append("sin bloque de llamada a la acción")
    if typ == "Artículo" and not p.tables:
        issues.append("artículo sin tabla comparativa")
    tables_ok = sum(1 for t in p.tables if t["caption"] or t["thead"])
    return {
        "url": url, "status": status, "tipo": typ, "main_class": p.main_class,
        "title": p.title.strip(), "description": p.meta.get("description", ""),
        "h1": h1[0] if h1 else "", "canonical": canon, "robots": robots,
        "x_robots": headers.get("X-Robots-Tag", ""),
        "schema": sorted(set(types)), "schema_ids": sorted(set(ids)),
        "palabras": words, "enlaces_internos": len(internal),
        "tablas": len(p.tables), "tablas_con_caption_o_thead": tables_ok,
        "th_scope": sum(t["th_scope"] for t in p.tables),
        "revisado": reviewed, "aviso_medico": disclaimer, "cta": cta,
        "faq": has_faq, "fuentes": has_sources, "fecha_visible": has_date,
        "respuesta_directa_palabras": len(first_p.split()),
        "citabilidad": cit, "secciones": nsec,
        "h2": [t for lvl, t in p.headings if lvl == 2],
        "problemas": issues,
    }


def site_urls(base):
    st, xml, _ = fetch(base + "/wp-sitemap-posts-page-1.xml")
    return re.findall(r"<loc>([^<]+)</loc>", xml)


def crawlers(base):
    # Se descarga con nuestro User-Agent: GoDaddy responde 403 al de Python por defecto.
    st_robots, robots_txt, _ = fetch(base + "/robots.txt")
    rp = urllib.robotparser.RobotFileParser()
    rp.parse(robots_txt.splitlines())
    out = {"robots_txt": robots_txt, "bots": []}
    for bot, purpose in CRAWLERS.items():
        allowed = rp.can_fetch(bot, base + "/blog/")
        st, html, h = fetch(base + "/blog/", ua=f"Mozilla/5.0 (compatible; {bot}/1.0)")
        out["bots"].append({"bot": bot, "para_que": purpose, "robots_permite": allowed,
                            "http": st, "contenido_en_html": "Revisado por" in html or "<h1" in html})
    st, txt, _ = fetch(base + "/llms.txt")
    out["llms_txt"] = {"http": st, "bytes": len(txt)}
    return out


def main(argv):
    out = None
    base = BASE
    args = []
    it = iter(argv)
    do_crawlers = False
    for a in it:
        if a == "--out":
            out = next(it)
        elif a == "--base":
            base = next(it).rstrip("/")
        elif a == "--crawlers":
            do_crawlers = True
        else:
            args.append(a)
    if do_crawlers:
        res = crawlers(base)
    else:
        urls = args or site_urls(base)
        res = []
        for u in urls:
            st, html, h = fetch(u)
            res.append(audit_html(u, st, html, h))
            print(f"{st} {u} problemas={len(res[-1]['problemas'])}", file=sys.stderr)
    text = json.dumps(res, ensure_ascii=False, indent=1)
    if out:
        open(out, "w").write(text)
    else:
        print(text)


if __name__ == "__main__":
    main(sys.argv[1:])
