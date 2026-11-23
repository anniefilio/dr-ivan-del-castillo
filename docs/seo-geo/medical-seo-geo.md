# Flujo medical-seo-geo

Flujo reutilizable para auditar y mejorar el SEO y la visibilidad en buscadores con IA (GEO) del sitio. Sirve igual en Codex y en Claude Code porque no depende de comandos de ninguno de los dos: son dos scripts de Python sin dependencias y estas instrucciones. `AGENTS.md` apunta a este archivo.

## Pasos

1. **Auditar el sitio publicado** (las páginas que lista el sitemap de WordPress):
   ```bash
   python3 scripts/seo_geo_audit.py --out /tmp/auditoria.json
   ```
   Para una sola página: `python3 scripts/seo_geo_audit.py https://drcolumnavertebral.com/blog/mielopatia/`
2. **Revisar el acceso de rastreadores** (robots.txt, respuesta HTTP con el User-Agent de cada bot y llms.txt):
   ```bash
   python3 scripts/seo_geo_audit.py --crawlers
   ```
3. **Regenerar las matrices** de `docs/seo-geo/` (reporte por URL, contenido y Schema):
   ```bash
   python3 scripts/seo_geo_report.py /tmp/auditoria.json docs/seo-geo
   ```
4. **Corregir** solo lo técnico y verificable: metadatos, Schema, «Revisado por el Dr.», aviso médico y enlaces. El contenido clínico nuevo (tablas, respuestas, preguntas frecuentes) se prepara en `matriz-tablas-comparativas.md` y **no se publica sin la aprobación del Dr.**
5. **Publicar** con el flujo de `AGENTS.md` y volver a correr el paso 1 sobre el sitio publicado. Anotar el resultado en `validacion.md`.

## Qué revisa el script por página

| Área | Qué mide |
|---|---|
| Metadatos | title (más de 65 caracteres = largo), description (70 a 165), canonical igual a la URL, robots, Open Graph |
| Estructura | un solo H1, H2, número de palabras, enlaces internos, imágenes sin `alt` |
| Schema | tipos JSON-LD encontrados, `@id`, errores de sintaxis |
| Reglas del sitio | «Revisado por el Dr.», aviso médico desplegable, bloque de llamada a la acción, enlaces internos en pestaña nueva, `/#` |
| Contenido médico | tablas (con `caption`, `thead` y `scope`), preguntas frecuentes, fuentes, fecha visible, largo de la respuesta inicial |
| Citabilidad | puntaje interno de 0 a 100 por sección |

## Citabilidad: qué es y qué no es

La idea viene del repositorio [geo-seo-claude](https://github.com/zubair-trabzada/geo-seo-claude) (`scripts/citability_scorer.py`, licencia MIT). Ese script busca patrones en inglés («is a», «refers to», montos en dólares, nombres propios en mayúscula), así que en español da resultados sin sentido. Se reescribió para español y salud.

El puntaje suma cinco cosas:
- respuesta directa al inicio de la sección (30 puntos);
- que la sección se entienda sola (25);
- frases cortas (20);
- datos y fuentes con nombre (15);
- experiencia propia del Dr. (10).

Es una **métrica interna de diagnóstico**: sirve para comparar páginas del mismo sitio y ver cuáles mejorar primero. **No mide** si Google, ChatGPT, Perplexity ni ningún otro motor va a citar la página, y no debe presentarse así.

## Recursos de geo-seo-claude: qué se usó y qué no

Se revisó el commit `989cae0` (5 de octubre de 2026), sin instalarlo ni ejecutarlo.

| Recurso del repositorio | Existe | Uso en este proyecto |
|---|---|---|
| Comandos `/geo audit`, `/geo quick`, etc. (`geo/SKILL.md`, `skills/`) | Sí | No se instalaron. Son instrucciones para Claude Code; su lógica útil se pasó a este flujo. |
| `scripts/citability_scorer.py` | Sí | Adaptado al español en `seo_geo_audit.py`. |
| `skills/geo-crawlers` (lista de rastreadores de IA) | Sí | Se usó la lista, corrigiendo funciones: GPTBot y ClaudeBot son de entrenamiento; las búsquedas de ChatGPT y Claude usan OAI-SearchBot y Claude-SearchBot. |
| `schema/*.json` (plantillas) | Sí | Son genéricas: LocalBusiness, Organization, Article, Product, SaaS y WebSite con buscador. No hay plantillas médicas (Physician, MedicalCondition, MedicalProcedure). Se siguió el patrón `@graph` + `@id` que el sitio ya usaba. |
| `scripts/llmstxt_generator.py` | Sí | No hizo falta: el sitio ya publica `/llms.txt`. |
| `scripts/brand_scanner.py` | Sí | No se ejecutó: manda el nombre del doctor a sitios externos (Reddit, Wikipedia en inglés, etc.) y solo revisa fuentes en inglés. La presencia de marca se evaluó a mano (ver `auditoria-geo.md`). |
| `scripts/fetch_page.py`, reportes PDF, CRM de prospectos, panel Flask | Sí | No aplican: son para agencias que venden auditorías. |
| `install.sh` | Sí | No se ejecutó: instala dependencias desde `main` sin versión fija y reescribe archivos en `~/.claude`. |

## Reglas

- No inventar datos médicos, credenciales, porcentajes ni tiempos de recuperación.
- No tocar diseño, logotipo, fotografías ni colores.
- Las opiniones del Dr. no llevan tablas.
- No cambiar `robots.txt` ni los permisos de rastreadores sin autorización de Annie.
- En Google Analytics, Tag Manager, Search Console y Google Business Profile, Annie hace los cambios. El asistente revisa y da su opinión.
