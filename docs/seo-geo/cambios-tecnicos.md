# Cambios técnicos

## 23 de noviembre de 2026: sitio c308da4 y siguiente, tema 1.5.12

| Archivo | Cambio | Por qué |
|---|---|---|
| `procedimientos/*/index.html` (9) | Nota «Revisado por el Dr. Iván del Castillo Vergara», aviso médico desplegable (cerrado), `reviewedBy` en el JSON-LD y `about: MedicalProcedure` en los 6 que son procedimientos (ALIF/XLIF, revisión, descompresión, discectomía, fusión, mínima invasión) | Regla del sitio para contenido médico; E-E-A-T; entidad médica |
| `columna/*/index.html` (9) | Nota «Revisado por el Dr.» y JSON-LD nuevo: `MedicalWebPage` + `MedicalCondition` + `BreadcrumbList`, con el Dr. como `reviewedBy` y las fuentes como `citation` | No tenían datos estructurados |
| `blog/{degeneracion-discal, dolor-despues-de-cirugia-de-columna, escoliosis, espondilolistesis, mielopatia-cervical}/index.html` | Nota «Revisado por el Dr.» | Faltaba |
| `noticias/{cementacion-vertebral, infiltracion-espera, opioides-aclaraciones, opioides-mielopatia, plasma-rico-plaquetas, tabaquismo-cirugia-lumbar}/index.html` | JSON-LD `MedicalWebPage` + `BreadcrumbList`, con el mismo formato que las demás opiniones | Las 6 opiniones más nuevas no tenían |
| Tema `functions.php` | Open Graph (`og:title`, `og:description`, `og:url`, `og:type`, `og:image` con el retrato oficial, `og:locale`, `og:site_name`) y `twitter:card` | Ninguna página los tenía: al compartir en WhatsApp o Facebook no salía imagen ni descripción |
| `scripts/seo_geo_audit.py` | Nuevo: auditoría SEO/GEO sin dependencias | Flujo medical-seo-geo |
| `scripts/seo_geo_report.py` | Nuevo: genera las matrices de `docs/seo-geo/` | Flujo medical-seo-geo |
| `docs/seo-geo/` | Entregables de la auditoría | Documentación |
| `AGENTS.md` | Referencia al flujo medical-seo-geo | Para que Codex y Claude lo usen |

**Qué no se tocó:**
- diseño, colores, tipografía, logotipo, fotos y animaciones;
- formularios e integraciones;
- `robots.txt`;
- Analytics y Tag Manager;
- texto clínico.

Los textos agregados son los bloques estándar que el sitio ya usaba en otras páginas.
