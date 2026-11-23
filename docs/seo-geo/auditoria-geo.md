# Auditoría GEO (buscadores con IA)

Fecha: 23 de noviembre de 2026. Nada de esto garantiza aparecer en AI Overviews, ChatGPT, Perplexity, Gemini ni Copilot. Son condiciones que facilitan que el contenido se encuentre, se entienda y se cite.

## Acceso de rastreadores

Se probó con `python3 scripts/seo_geo_audit.py --crawlers`: lectura de `robots.txt` y petición a `/blog/` con el User-Agent de cada bot.

| Rastreador | Para qué sirve | robots.txt | HTTP |
|---|---|---|---|
| Googlebot | Google Search, incluidos AI Overviews y AI Mode | Permite | 200 |
| Bingbot | Bing; también alimenta Copilot | Permite | 200 |
| OAI-SearchBot | Resultados de búsqueda de ChatGPT (no entrena) | Permite | 200 |
| ChatGPT-User | Visitas que pide una persona desde ChatGPT | Permite | 200 |
| GPTBot | Entrenamiento de modelos de OpenAI | Permite | 200 |
| ClaudeBot | Entrenamiento de modelos de Anthropic | Permite | 200 |
| Claude-SearchBot / Claude-User | Búsqueda de Claude y visitas pedidas por una persona | Permite | 200 |
| PerplexityBot | Índice de Perplexity | Permite | 200 |
| Google-Extended | Uso en Gemini (no afecta Google Search) | Permite | 200 |
| Applebot-Extended, CCBot | Apple Intelligence y Common Crawl | Permite | 200 |

**Sobre el acceso:**
- Todo el contenido está en el HTML que entrega el servidor, sin depender de JavaScript, así que los bots lo leen completo.
- GoDaddy responde 403 a clientes que no se identifican (por ejemplo, el User-Agent por defecto de Python). Los bots reales sí reciben 200.
- **Decisión pendiente (Annie):** hoy se permite también el entrenamiento (GPTBot, ClaudeBot, CCBot, Google-Extended). Bloquearlo no afecta las búsquedas con IA. No se cambió nada.

**llms.txt:** el sitio publica `/llms.txt` (1.9 KB): doctor, consulta, padecimientos, procedimientos y académico. Es un formato experimental: ningún buscador lo exige y no se sabe que influya en el posicionamiento. Basta con mantenerlo al día.

## Citabilidad interna por tipo de página

La citabilidad va de 0 a 100: es el promedio de las 5 mejores secciones de cada página. Es una métrica propia de diagnóstico; ver `medical-seo-geo.md`.

| Tipo | Páginas | Promedio |
|---|---|---|
| Artículos del blog | 21 | 59 |
| Padecimientos (`/columna/…`) | 9 | 57 |
| Opiniones académicas | 22 | 57 |
| Procedimientos | 9 | 52 |
| Inicio | 1 | 47 |
| Perfiles | 5 | 44 |
| Servicios y contacto | 11 | 45 |

**Qué baja el puntaje de padecimientos y procedimientos:**
- **Respuesta inicial breve.** El primer párrafo tiene 15 a 48 palabras, menos que los 40 a 70 recomendados. Una respuesta completa al inicio («La estenosis lumbar es… Se nota… Se trata con…») es lo que los motores suelen tomar como cita.
- **Sin tabla comparativa.** Las tablas propuestas están en `matriz-tablas-comparativas.md`.
- **Sin fecha visible de revisión.** El blog sí la tiene.
- **Procedimientos con una sola fuente.** Agregar guías (AAOS, NASS, NICE) ayuda.

## Autoridad y marca (E-E-A-T)

| Señal | Situación |
|---|---|
| Autoría o revisión médica visible | Ahora sí en todas las páginas médicas. Antes faltaba en 9 procedimientos (sin «Revisado» ni aviso médico), 9 padecimientos y 5 artículos. |
| Perfil del especialista | `/perfil-profesional/`: formación, membresías y publicaciones. |
| Perfiles enlazados en Schema (`sameAs`) | Doctoralia, Instagram, TikTok y YouTube. |
| Cédula profesional y certificación del consejo | No están en Schema. Hay que pedir los datos verificados al Dr.; no se agregan sin confirmar. |
| Google Business Profile | No se pudo revisar sin acceso. Hay que comprobar que nombre, dirección y teléfono coincidan con el sitio, y luego agregar el enlace del perfil en `sameAs`. |
| Wikidata / Wikipedia | No hay entrada. No se recomienda crearla por cuenta propia: Wikipedia exige fuentes independientes. |

## SEO local

- **Dirección y teléfono (NAP)**: los mismos en el sitio, en `llms.txt` y en Schema: Tlacotalpan 59, Roma Sur, Cuauhtémoc, 06760, CDMX, +52 55 7533 9867.
- **Segunda ubicación**: el centro de rehabilitación (Calzada Obrero Mundial 237) tiene su propia página.
- **Falta en Schema:**
  - horario de atención: el Dr. tiene que confirmarlo;
  - nombre del hospital dentro de la dirección (Hospital Ángeles Metropolitano);
  - coordenadas.
- **No conviene** crear páginas por colonia o alcaldía: serían duplicadas.
