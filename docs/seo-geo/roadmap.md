# Plan SEO/GEO priorizado

Impacto y esfuerzo son estimaciones relativas: no son pronósticos de tráfico ni de posiciones.

| # | Acción | Impacto esperado | Esfuerzo | Dependencias | Estado | Riesgos | Validación |
|---|---|---|---|---|---|---|---|
| 1 | Open Graph y Twitter Card en todas las páginas | Medio: mejores vistas previas al compartir, más clics desde redes y WhatsApp | Bajo | — | Implementado y validado | Ninguno | Etiquetas presentes en el HTML publicado |
| 2 | «Revisado por el Dr.» y aviso médico en todas las páginas médicas | Alto en confianza (E-E-A-T, sector salud) | Bajo | — | Implementado y validado | Ninguno | El script ya no marca faltantes |
| 3 | Schema médico: MedicalCondition (9), MedicalProcedure (6), reviewedBy y las 6 opiniones nuevas | Medio: entidades claras para Google y los motores de IA | Bajo | — | Implementado y validado | No genera resultados enriquecidos por sí solo | JSON-LD válido en el sitio publicado |
| 4 | Respuesta directa de 40 a 70 palabras al inicio de cada padecimiento y procedimiento | Alto para GEO y fragmentos destacados | Medio | Aprobación del Dr. | Propuesta: requiere aprobación médica | Ninguno si la revisa el Dr. | Citabilidad interna antes y después |
| 5 | Tablas comparativas en padecimientos y procedimientos (ver matriz) | Alto para GEO y claridad para pacientes | Medio | Aprobación del Dr.; confirmar si ofrece endoscopia | Propuesta: requiere aprobación médica | Errores clínicos si no se revisan | Script: tablas > 0 y con `caption` |
| 6 | Acortar las descriptions de padecimientos y equipo a 150–160 caracteres | Medio: menos cortes en Google | Bajo | Visto bueno de Annie en los textos | Pendiente | Ninguno | Script: description dentro de rango |
| 7 | Titles de opiniones: cambiar «\| Opinión del Dr. Iván del Castillo» por un sufijo corto y acortar los titulares largos del blog | Bajo-medio | Bajo | Ajustar la plantilla de opiniones para que no vuelva | Pendiente | Cambiar titles ya indexados mueve el CTR unas semanas | Script: title de 65 caracteres o menos |
| 8 | Fecha visible «Última revisión» en padecimientos y procedimientos | Medio (E-E-A-T) | Bajo | El Dr. confirma la fecha de revisión | Requiere aprobación médica | Poner fechas sin revisión real | Script: fecha visible |
| 9 | Datos verificados del Dr. en Schema: cédula, consejo, hospital | Medio (identidad médica) | Bajo | Datos del Dr. | Requiere datos | Ninguno si están verificados | Validador de Schema.org |
| 10 | Horario y hospital en el Schema del consultorio; revisar que Google Business Profile coincida y enlazarlo en `sameAs` | Medio (SEO local) | Bajo | Acceso de Annie a Business Profile | Requiere acceso externo | Diferencias entre el sitio y el perfil | Comparar el perfil con el sitio |
| 11 | VideoObject en `/videos/` para los videos de YouTube | Bajo-medio (resultados de video) | Bajo | — | Pendiente | Ninguno | Prueba de resultados enriquecidos |
| 12 | Core Web Vitals: medir LCP, INP y CLS en celular | Medio | Bajo | PageSpeed Insights / Search Console | Requiere acceso externo | — | Informe CWV de Search Console |
| 13 | Decidir si se permite el entrenamiento de IA (GPTBot, ClaudeBot, CCBot, Google-Extended) | No afecta la búsqueda | Bajo | Decisión de Annie y del Dr. | Requiere decisión | — | `seo_geo_audit.py --crawlers` |
| 14 | Pedir indexación en Search Console de las páginas con cambios | Bajo-medio (velocidad) | Bajo | Annie en Search Console | Pendiente (Annie) | — | Inspección de URL |

**No recomendado:**
- `FAQPage` para buscar resultados enriquecidos: Google ya casi no los muestra.
- Páginas por colonia o alcaldía.
- Crear Wikipedia o Wikidata por cuenta propia.
- Páginas para variaciones mínimas de una misma palabra clave.
