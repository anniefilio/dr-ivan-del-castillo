# Reporte de validación

Fecha: 23 de noviembre de 2026. Sitio publicado con el tema 1.5.13 (GitHub b9c15c2). WordPress respondió «Páginas creadas: 0. Páginas actualizadas: 89» y después se vació la caché.

## Resultados en el sitio publicado

| Prueba | Antes | Después |
|---|---|---|
| Respuesta HTTP de las 88 URLs del sitemap | 88 con 200 | 88 con 200 |
| Páginas sin Open Graph | 88 | 0 |
| Páginas médicas con «Revisado por el Dr.» y aviso médico desplegable | 38 de 61 | 61 de 61 |
| Padecimientos sin JSON-LD | 9 | 0 |
| Opiniones sin JSON-LD | 6 | 0 |
| Páginas con `MedicalWebPage` | 31 | 46 |
| `MedicalCondition` / `MedicalProcedure` | 0 / 0 | 9 / 6 |
| JSON-LD con errores de sintaxis | 0 | 0 |
| Canonical incorrecto, `noindex`, H1 múltiple, imágenes sin `alt`, enlaces internos en pestaña nueva | 0 | 0 |
| Prioridad alta en `reporte-por-url.md` | 6 | 0 |

**Qué quedó igual:** 46 titles largos y 18 descriptions fuera de rango (ver `roadmap.md`, puntos 6 y 7), y la falta del bloque de llamada a la acción en `/contacto/` y `/primera-consulta/`.

## Revisión visual

| Página | Celular (375 px) | Computadora | Notas |
|---|---|---|---|
| /procedimientos/discectomia/ (vista local) | Sin desborde | OK | «Revisado» bajo el texto inicial; aviso médico cerrado |
| /columna/estenosis-cervical-y-lumbar/ (vista local) | Sin desborde | OK | «Revisado» antes de la ilustración |
| /procedimientos/fusion-vertebral/ (publicada) | Sin desborde | — | 8 etiquetas Open Graph, JSON-LD válido, aviso cerrado |
| /columna/hernia-de-disco-ciatica-y-radiculopatia/ (publicada) | Sin desborde | — | «Revisado» visible |

## Verificación del tema

`scripts/verificar-wordpress.py` dio: «OK: 89 páginas, enlaces locales y recursos intactos». También pasó su prueba de enlaces raíz, comillas, atributos y enlaces externos.

## Qué no se validó

- Prueba de resultados enriquecidos de Google: se hace a mano en https://search.google.com/test/rich-results.
- Validador de Schema.org.
- Core Web Vitals.
- Vista previa real al compartir en WhatsApp o Facebook. WhatsApp guarda las vistas previas en caché; el Depurador de Facebook sirve para renovarlas.
