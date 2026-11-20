# Cookies y analítica — publicación 17 de noviembre de 2026

Producción: https://drcolumnavertebral.com/

Plugin activo: `ivan-consent/ivan-consent.php`, versión **1.0.1**. El código fuente está en `integrations/ivan-consent/`; los ZIPs de instalación son artefactos locales excluidos de Git. Publica los dos textos legales mediante una migración única con fecha local de México y añade banner, estilos y preferencias en todas las páginas. Su filtro retira el fragmento anterior de GTM antes de entregar el HTML. Debe permanecer activo para mantener el consentimiento.

GTM `GTM-MQMHWNXK`, versión pública 2; Analytics `G-F9YPDKJ64X` se configura exclusivamente en GTM. Etiqueta principal en evento `ivan_analytics_consent_granted`; eventos de contacto `whatsapp_click`, `phone_click`, `appointment_click`. La etiqueta adicional creada automáticamente por Google está en pausa. Detección automática de datos proporcionados por usuarios y de eventos desactivada. URL de página sin consulta ni fragmento y referente fijo para evitar enviar mensajes o parámetros personales.

Consent Mode básico: las cuatro categorías de Google parten denegadas. Solo aceptar concede `analytics_storage`; publicidad permanece denegada. Rechazar no carga GTM; retirar el consentimiento deshabilita GA, elimina cookies analíticas y recarga para retirar bibliotecas cargadas. Preferencia necesaria guardada 180 días, sincronizada entre pestañas. La vista previa está bloqueada por hostname para evitar estadísticas de producción.

Analytics: medición mejorada desactivada; conservación de eventos y usuarios 14 meses, restablecimiento por nueva actividad desactivado. No se configuraron funciones publicitarias ni datos de usuarios.

Validación: 10 pruebas Node aprobadas; coincidencia SHA-256 entre el script probado y publicado; HTML público de ambos textos con fecha visible y JSON-LD 2026-11-17; ausencia de carga incondicional anterior de GTM. Interfaz comprobada en Chrome: banner visible, rechazo, reapertura, aceptación y retiro. Se verificó además el recurso público de GTM y sus reglas. No se realizó una captura de tráfico completa ni se afirmó recepción en los informes de GA, que puede demorar.

Comando: `/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node --test tests/cookie-consent.test.cjs`.

## Corrección 1.0.1 publicada por Claude

El CSS del plugin conserva `.ivan-cookie-banner,.ivan-cookie-banner[role="region"]{position:fixed!important;…}` para prevalecer sobre `[role="region"]{position:relative}` de WordPress y mantener el banner fijo en la pantalla. La hoja del plugin usa `cookie-consent.css?v=2` para renovar la caché. La migración de textos conserva deliberadamente la clave `ivanc_release_version=1.0.0`: esta corrección visual no debe volver a publicar los textos ni cambiar sus fechas. La copia CSS de `assets/` pertenece a la vista previa; el arreglo de WordPress está en `integrations/ivan-consent/assets/`.

Los archivos ZIP se generan desde el código fuente, pero no se guardan en GitHub. Este respaldo en Git no requiere volver a instalar el plugin ni modificar WordPress.

## Microsoft Clarity — plugin 1.0.3 (19 de noviembre de 2026)

GTM versión pública 3 incluye la etiqueta «Clarity» (HTML personalizado, proyecto `zg7219747v`) en «Contenedor cargado». Como GTM solo entra tras aceptar, Clarity también depende del consentimiento. Annie decidió mantenerla. El banner ahora nombra «Google Analytics y Microsoft Clarity»; rechazar borra también las cookies propias de Clarity (`_clck`, `_clsk`, `_cltk`) y, si ya estaba cargada, recarga para retirarla. El aviso de privacidad (secciones 6 y 7, fecha 19 de noviembre de 2026) menciona a Microsoft Clarity, sus mapas de calor y grabaciones, y su conservación de 30 días. El texto vive en `privacidad/index.html` (lo publica la sincronización del tema) y se copió igual en `legal.json` para que una reinstalación no regrese el texto anterior. Script con `?v=3`.
