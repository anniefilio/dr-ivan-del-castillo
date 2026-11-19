# Reglas del proyecto: sitio del Dr. Iván del Castillo

Estas reglas valen para cualquier asistente (Codex, Claude u otro) que trabaje en este repositorio. Responde siempre en español.

## Qué es cada cosa

- **Este repositorio** (`~/Proyectos/dr-ivan-del-castillo-publico`, GitHub `anniefilio/dr-ivan-del-castillo`) es la fuente del sitio.
- **El sitio que ve la gente** es WordPress en https://drcolumnavertebral.com (GoDaddy). No se actualiza solo: hay que armar el tema y publicarlo (ver abajo).
- **El tema de WordPress** se arma en `~/Proyectos/dr-ivan-del-castillo-wordpress`.
- **El plugin de cookies** `ivan-consent` vive en `integrations/ivan-consent/` y se publica aparte, como plugin de WordPress.
- Los archivos del doctor (logos, fotos, videos, documentos) están en `~/Documents/Dr. Iván del Castillo/`. No van a GitHub.
- No trabajes dentro de `~/Documents/Codex/...`: son accesos viejos que apuntan a `~/Proyectos`. iCloud borraba archivos ahí.

## Reglas de trabajo

1. **Uno a la vez.** Antes de empezar, corre `git status`. Si hay cambios que no son tuyos, otro asistente está trabajando: avísale a Annie y no los toques.
2. **Guarda en GitHub antes de publicar.** Termina cada cambio con commit y push a `main`. Nunca publiques en WordPress algo que no esté en GitHub.
3. **Publica solo lo que está en GitHub.** El tema se arma desde `git archive HEAD`, no desde la carpeta de trabajo.
4. **Revisa lo que guardas.** Agrega los archivos por nombre (`git add archivo`), no con `git add -A`. Si `git status` muestra archivos borrados que tú no borraste, no los incluyas: avísale a Annie.
5. **No subas a GitHub** ZIPs, videos de pacientes, datos personales ni archivos temporales.
6. **Verifica antes de decir que quedó**: revisa en el sitio publicado, en computadora y en celular (375 px de ancho), sin desbordes.

## Cómo publicar en WordPress

1. Commit y push a `main`.
2. Arma el tema desde GitHub:
   ```bash
   cd ~/Proyectos/dr-ivan-del-castillo-publico
   T=$(mktemp -d); git archive HEAD | tar -x -C $T; rm -rf $T/wordpress $T/borradores
   rsync -a --delete $T/ ~/Proyectos/dr-ivan-del-castillo-wordpress/wordpress/source-github/; rm -rf $T
   ```
3. En `~/Proyectos/dr-ivan-del-castillo-wordpress`: sube `Version:` en `wordpress/dr-ivan-del-castillo/style.css` (siempre mayor que la publicada) y pon el commit corto en el texto "Sincroniza las N páginas de GitHub …" de `functions.php`.
4. Corre `python3 scripts/preparar-wordpress.py` y luego `python3 scripts/verificar-wordpress.py`. Debe decir "OK: N páginas" (hoy son 84; si agregas o quitas páginas, ajusta el número en `scripts/verificar-wordpress.py` y en `functions.php`). Genera `wordpress/dr-ivan-del-castillo.zip`.
5. En WordPress: Apariencia → Temas → Añadir → Subir tema → elegir el ZIP → **Reemplazar el instalado con el subido**.
6. Apariencia → Importar sitio del doctor → **Sincronizar versión de GitHub** (debe decir "Páginas actualizadas: N").
7. Barra superior → **Vaciar caché**. Revisa el sitio publicado.

El navegador integrado no sube archivos; con la extensión de Chrome sí se puede (máximo 10 MB). Nunca escribas contraseñas: Annie inicia sesión.

## Reglas del sitio

- Colores de marca solamente: #123451, #245779, #E8F0F4, #789387, #F8F8F5. Nada morado.
- Los enlaces internos se abren en la misma pestaña. No uses `/#`, ni flechas en botones o enlaces.
- El blog va sin desplegables. Todo contenido médico lleva aviso médico y "Revisado por el Dr. Iván del Castillo Vergara".
- Académico: cada artículo de «Publicaciones recientes y opinión del Dr.» lleva su opinión plegable justo debajo (`details.medical-opinion.entry-opinion`) y su página propia en `noticias/<slug>/`. Copia el formato de las tarjetas existentes; ya no hay caja separada de opiniones.
- Solo se escriben opiniones de artículos con importancia para pacientes y relevancia científica. Nada de reportes de caso, editoriales, notas técnicas ni declaraciones gremiales.
- Cada página lleva la clase de su `<main>` (por ejemplo `academic-page`); el tema la conserva en WordPress.
- Analytics (G-F9YPDKJ64X) se carga solo desde Google Tag Manager y solo si la persona acepta las cookies. No lo instales por separado en el código.
- Videos de YouTube (canal @dr.ivandelcastillo): siempre "No es contenido para niños" y sin restricción de edad. Los testimonios sin consentimiento firmado van como Ocultos.
- En Google Analytics y Tag Manager, Annie quiere hacer los cambios ella misma para aprender: revisa y da feedback, sin cambiar nada salvo que lo pida.
