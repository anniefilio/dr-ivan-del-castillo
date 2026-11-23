#!/usr/bin/env python3
"""Convierte el JSON de scripts/seo_geo_audit.py en las matrices de docs/seo-geo/.

Uso:
  python3 scripts/seo_geo_audit.py --out /tmp/auditoria.json
  python3 scripts/seo_geo_report.py /tmp/auditoria.json docs/seo-geo
"""
import json
import sys
from collections import Counter
from pathlib import Path
import re
from urllib.parse import urlsplit

MEDICAL = {"Artículo", "Patología", "Procedimiento", "Opinión académica"}
SCHEMA_ESPERADO = {
    "Inicio": {"WebSite", "Physician", "Person"},
    "Artículo": {"BlogPosting"},
    "Patología": {"MedicalWebPage", "MedicalCondition", "BreadcrumbList"},
    "Procedimiento": {"MedicalWebPage", "BreadcrumbList"},
    "Opinión académica": {"MedicalWebPage"},
    "Perfil": {"Person"},
}


def ruta(u):
    return urlsplit(u).path or "/"


def esc(s):
    return str(s).replace("|", "\\|").replace("\n", " ")


def estado(ok, aviso=False):
    return "OK" if ok else ("Revisar" if aviso else "Falta")


def indexable(p):
    directives = " ".join((p.get("robots", ""), p.get("x_robots", "")))
    return p["status"] == 200 and not re.search(
        r"\b(?:noindex|none)\b", directives, re.IGNORECASE
    )


def evaluar(p):
    seo_ok = indexable(p) and p["title"] and p["description"] and p["h1"]
    seo_aviso = any(x.startswith(("title largo", "description de", "canonical distinto"))
                    for x in p["problemas"])
    falta = SCHEMA_ESPERADO.get(p["tipo"], set()) - set(p["schema"])
    med = p["tipo"] in MEDICAL
    eeat = (p["revisado"] and p["aviso_medico"]) if med else True
    tablas = p["tablas"] > 0
    geo = p["citabilidad"]
    prioridad = "Alta" if (med and (not eeat or falta)) else "Media" if (med and (not tablas or geo < 50)) else "Baja"
    return {
        "SEO": estado(seo_ok and not seo_aviso, aviso=seo_ok),
        "GEO": f"{geo}",
        "Schema": "OK" if not falta else "Falta " + ", ".join(sorted(falta)),
        "E-E-A-T": estado(eeat) if med else "No aplica",
        "Tablas": f"{p['tablas']}" if p["tipo"] in ("Artículo", "Patología", "Procedimiento") else "No aplica",
        "Prioridad": prioridad,
    }


def main(src, outdir):
    d = json.load(open(src))
    out = Path(outdir)
    out.mkdir(parents=True, exist_ok=True)
    d.sort(key=lambda p: (p["tipo"], p["url"]))

    # Reporte por URL
    rows = ["| URL | Tipo | SEO | GEO (citabilidad interna) | Schema | E-E-A-T | Tablas | Prioridad |", "|---|---|---|---|---|---|---|---|"]
    for p in d:
        e = evaluar(p)
        rows.append(f"| {ruta(p['url'])} | {p['tipo']} | {e['SEO']} | {e['GEO']} | {e['Schema']} | {e['E-E-A-T']} | {e['Tablas']} | {e['Prioridad']} |")
    cnt = Counter(evaluar(p)["Prioridad"] for p in d)
    (out / "reporte-por-url.md").write_text(
        "# Reporte SEO/GEO por URL\n\n"
        f"Generado por `scripts/seo_geo_report.py` con {len(d)} páginas del sitemap de WordPress. "
        f"Prioridad: {cnt['Alta']} alta, {cnt['Media']} media, {cnt['Baja']} baja.\n\n"
        "La columna GEO es la citabilidad interna (0 a 100, promedio de las 5 mejores secciones). "
        "Es una métrica de diagnóstico propia, no una medición de Google, ChatGPT ni otro buscador.\n\n"
        + "\n".join(rows) + "\n")

    # Matriz de contenido (inventario)
    rows = ["| URL | Tipo | H1 | Title | Largo title | Largo description | Canonical | Indexable | Palabras | Tablas | Preguntas frecuentes | Fuentes |", "|---|---|---|---|---|---|---|---|---|---|---|---|"]
    for p in d:
        canon = "OK" if p["canonical"].rstrip("/") == p["url"].rstrip("/") else esc(p["canonical"])
        idx = "Sí" if indexable(p) else "No"
        rows.append(f"| {ruta(p['url'])} | {p['tipo']} | {esc(p['h1'])} | {esc(p['title'])} | {len(p['title'])} | {len(p['description'])} | {canon} | {idx} | {p['palabras']} | {p['tablas']} | {'Sí' if p['faq'] else 'No'} | {'Sí' if p['fuentes'] else 'No'} |")
    (out / "matriz-contenido.md").write_text(
        "# Matriz de contenido\n\nInventario de URLs publicadas, generado por `scripts/seo_geo_report.py`. "
        "Title recomendado: hasta 60–65 caracteres. Description: 70 a 160.\n\n" + "\n".join(rows) + "\n")

    # Matriz de Schema
    rows = ["| URL | Tipo | Tipos Schema.org encontrados | Faltan (según el tipo de página) |", "|---|---|---|---|"]
    for p in d:
        falta = SCHEMA_ESPERADO.get(p["tipo"], set()) - set(p["schema"])
        tipos = ", ".join(t for t in p["schema"] if t not in ("ListItem", "PostalAddress", "ContactPoint")) or "Ninguno"
        rows.append(f"| {ruta(p['url'])} | {p['tipo']} | {tipos} | {', '.join(sorted(falta)) or '—'} |")
    total = Counter(t for p in d for t in p["schema"])
    resumen = ", ".join(f"{k} ({v})" for k, v in total.most_common() if k not in ("ListItem",))
    (out / "matriz-schema.md").write_text(
        "# Matriz de datos estructurados (Schema.org)\n\n"
        f"Conteo de páginas por tipo: {resumen}.\n\n" + "\n".join(rows) + "\n")
    print(f"OK: {len(d)} páginas -> {out}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "docs/seo-geo")
