# Sitemap automático — Dr. Iván del Castillo

Dominio oficial confirmado: `https://drcolumnavertebral.com`.

## Arquitectura auditada

- Producción: WordPress 7.1.4, tema propio «Dr. Iván del Castillo» 1.3.7, en GoDaddy.
- Repositorio: HTML/CSS/JavaScript estático para la vista previa de GitHub Pages; sin Next.js ni proceso de compilación previo.
- Las 78 páginas de contenido del paquete del tema se importan como `page`. Por ello los artículos del blog **no** se deben buscar solamente en el tipo `post`.
- Producción tenía 80 páginas en el sitemap nativo, además del post de ejemplo `hello-world`, archivos de usuarios y categorías.
- El HTML estático de la vista previa conserva `noindex, nofollow` y canónicas de GitHub. No se ha alterado esa protección ni cambiado ningún slug.
- El viejo sitemap estático enumeraba esas URLs noindex y estaba incompleto respecto a las nuevas publicaciones académicas. Se reemplazó por un sitemap de vista previa que respeta sus directivas (actualmente vacío). **No es el sitemap de producción.**

## Implementación publicada

`integrations/ivan-sitemap.php` amplía el generador nativo de WordPress mediante filtros; no contiene una lista manual de contenidos publicados.

- Índice público: **https://drcolumnavertebral.com/sitemap.xml** (HTTP 200 directo).
- El endpoint anterior `/wp-sitemap.xml` sigue funcionando para compatibilidad.
- Los mapas de páginas y posts se consultan desde la base de datos en cada petición; publicarlos, retirarlos, enviarlos a papelera o cambiar su estado actualiza la siguiente respuesta automáticamente.
- Incluye los tipos públicos y visibles que suministre WordPress, excepto adjuntos (exclusión nativa).
- Paginación nativa: máximo 500 URLs por archivo, muy por debajo de los límites de 50,000 URLs/50 MB. Los archivos adicionales se incorporan al índice automáticamente.
- `lastmod`: `post_modified_gmt` de WordPress como referencia inicial. A partir de la instalación, guardar contenido idéntico conserva la fecha anterior; cambiar título, contenido o extracto la actualiza. No se usa la fecha del despliegue ni de la petición. Las fechas iniciales son las del registro/importación en WordPress, no se atribuyen a una revisión médica original desconocida.
- Se desactiva la caché de página para las respuestas XML mediante `DONOTCACHEPAGE` y cabeceras `no-cache`. Se vació la caché existente de GoDaddy al publicar.
- `robots.txt` dinámico conserva el bloqueo administrativo y añade `Sitemap: https://drcolumnavertebral.com/sitemap.xml`.
- El módulo es un plugin separado: actualizar el tema no lo sobrescribe.

## Exclusiones

| URL/tipo | Motivo |
| --- | --- |
| `/sample-page/` | Página de ejemplo de WordPress |
| `/hello-world/` | Entrada de ejemplo de WordPress |
| `/primera-consulta/gracias/` | Confirmación auxiliar, no página de descubrimiento |
| `/doctor/equipo/` | Padre técnico generado por el importador; los tres perfiles médicos sí se incluyen |
| Autores y categorías | Archivos auxiliares sin contenido editorial propio auditado |
| Adjuntos, borradores, pendientes, privados, papelera, páginas con contraseña | Excluidos por consultas nativas/publicación y protección |
| Canónicas hacia otra URL y redirecciones declaradas | Se excluyen del mapa; una canónica personalizada hacia sí misma permanece incluida |
| `noindex`/exclusión explícita | `_ivan_noindex=1` o `_ivan_sitemap_exclude=1`; se reconocen también los metadatos noindex de Yoast, Rank Math y SEOPress |

`_ivan_canonical` se refleja además en la canónica HTML. `_ivan_redirect` declara la exclusión; este módulo **no crea** la redirección. Los cambios de SEO/redirecciones hechos por reglas externas del hosting o por plugins futuros deben volver a auditarse: ningún generador de base de datos puede descubrir automáticamente una cabecera que un proxy añade después de generar la página.

## Validación del 17 de noviembre de 2026

Resultado guardado en `docs/sitemap-validation.json`:

- **77 URLs** únicas, absolutas, HTTPS y del dominio oficial.
- **16 artículos del blog**, **16 artículos académicos**.
- **9 páginas individuales de padecimientos** (`/columna/…`).
- **9 páginas individuales de procedimientos** (`/procedimientos/…`).
- Además de ellas, **6 páginas individuales de atención** (`/atencion/…`). Los índices de estas secciones se cuentan en el total, no en los subtotales individuales.
- Todas las URLs del mapa: HTTP 200, canónica HTML idéntica y ausencia de `noindex` tanto en HTML como en `X-Robots-Tag`.
- XML válido, sin duplicados ni fechas futuras, sin `priority`/`changefreq`; referencia correcta en robots.
- Plugin instalado y activado correctamente en el PHP real de WordPress. No había intérprete PHP local disponible para ejecutar `php -l`.
- 7 pruebas automáticas locales del validador: referencias relativas/externas, parámetros, XML recursivo, ciclos, lastmod futuro, redirecciones, canónicas y noindex; además de la protección noindex de la vista previa.
- La incorporación de futuros posts/páginas se basa en las consultas nativas de publicación (sin inventario estático). No se publicó un artículo ficticio en producción como prueba.
- Sitemap **enviado realmente** a Search Console y mostrado como **Correcto**. El contador de descubrimiento de Google puede tardar en actualizarse.

El sitemap facilita el descubrimiento; no garantiza indexación ni inclusión en respuestas de IA.

## Mantenimiento y pruebas

```sh
python3 -B scripts/build_preview_sitemap.py
python3 -B scripts/build_preview_sitemap.py --check
python3 -B -m unittest discover -s tests -v
python3 -B scripts/package_sitemap.py
python3 -B scripts/audit_sitemap.py --output docs/sitemap-validation.json
```

Para reinstalar, subir `integrations/ivan-sitemap.zip` en Plugins → Agregar plugin → Subir plugin. Desactivar el plugin revierte sus filtros; WordPress conserva su sitemap nativo.

Para Google Search Console registrar **https://drcolumnavertebral.com/sitemap.xml**. No registrar el sitemap vacío de GitHub Pages.

## Tag Manager, tarea anterior

Se instaló el fragmento que muestra Google para **GTM-MQMHWNXK** en la cabecera compartida de WordPress. Después de vaciar la caché, Google mostró «Se ha detectado su etiqueta de Google en su sitio web». No se crearon etiquetas de Analytics ni conversiones adicionales en esta tarea. Ese fragmento inicial fue retirado del HTML público por el plugin de consentimiento. La configuración vigente se describe en `docs/CONSENT.md`: GTM solo se carga después de aceptar analítica. No reintroducir una carga incondicional al actualizar el tema.
