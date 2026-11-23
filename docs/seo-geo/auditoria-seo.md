# Auditoría SEO técnica

Fecha: 23 de noviembre de 2026. Sitio publicado: https://drcolumnavertebral.com (WordPress, tema 1.5.12).

Datos obtenidos con `scripts/seo_geo_audit.py` sobre las 88 URLs del sitemap. El detalle por página está en `matriz-contenido.md` y en `reporte-por-url.md`.

## Cómo está armado el sitio

| Elemento | Situación |
|---|---|
| Framework | HTML estático en GitHub. El tema de WordPress lo importa como páginas y guarda title, description y JSON-LD en metadatos de cada página. |
| Rutas | Carpetas con `index.html`: `/columna/`, `/procedimientos/`, `/blog/`, `/noticias/`, `/doctor/` y páginas de servicio. |
| Metadatos | El tema imprime title, description, canonical (WordPress), robots y JSON-LD. Desde la versión 1.5.12 imprime también Open Graph y Twitter Card. |
| Sitemap | `https://drcolumnavertebral.com/sitemap.xml` (sitemap de WordPress), con 88 páginas. La página 404 no aparece, como debe ser. |
| robots.txt | Permite todo salvo `/wp-admin/` y declara el sitemap. |
| Redirecciones | Según `docs/PROTOCOLO-404-301.md` y `docs/redirecciones.csv` (plugin Redirection). |
| Formularios | Contacto y primera consulta. No se modificaron. |
| Analytics | Solo vía Tag Manager y con consentimiento (plugin `ivan-consent`). No se tocó. |

## Resultados

| Revisión | Resultado |
|---|---|
| Respuesta HTTP | 88 de 88 responden 200. |
| Indexabilidad | 88 de 88 son indexables (`max-image-preview:large`, sin `noindex`). |
| Canonical | 88 de 88 apuntan a su propia URL en drcolumnavertebral.com. |
| H1 | Las 88 tienen un solo H1. |
| JSON-LD | Sin errores de sintaxis. |
| Imágenes | Ninguna sin `alt`. |
| Enlaces internos | Ninguno en pestaña nueva y ninguno con `/#`. |
| Open Graph / Twitter | **Faltaban en las 88** (el tema no los imprimía). Corregido en el tema 1.5.12. |
| Title largo (más de 65 caracteres) | 46 páginas. 22 son opiniones, porque llevan «\| Opinión del Dr. Iván del Castillo» (104 a 133 caracteres). Google los corta, pero no los penaliza. |
| Description fuera de rango | 18 páginas. Los 9 padecimientos tienen de 187 a 271 caracteres, los 3 perfiles del equipo de 197 a 318, y `/terminos/` solo 54. |
| Bloque de llamada a la acción | Falta en `/contacto/` y `/primera-consulta/`. Son las páginas de destino del botón, así que parece intencional. Annie debe confirmarlo, porque AGENTS.md pide el bloque en todas las páginas. |

## Rendimiento (Core Web Vitals)

No se midió en esta auditoría: necesita PageSpeed Insights o el informe de Core Web Vitals de Search Console, con datos de usuarios reales. Queda en el plan de trabajo. En el código no hay JavaScript que bloquee la carga: los scripts del tema van al final y YouTube solo se carga al abrir un testimonio.
