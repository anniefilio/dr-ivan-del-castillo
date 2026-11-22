# Protocolo de páginas no encontradas (404) y redirecciones (301)

Sitio: https://drcolumnavertebral.com (WordPress en GoDaddy, con caché de Cloudflare).

Objetivo: que ningún paciente ni buscador llegue a una página rota, y que cuando una dirección cambie, la vieja lleve a la nueva sin perder posicionamiento.

## 1. Qué significa cada código

| Código | Cuándo se usa | Ejemplo |
| --- | --- | --- |
| **200** | La página existe y se muestra. | `/blog/hernia-de-disco/` |
| **301** | La página **se mudó para siempre** a otra dirección. El buscador pasa el posicionamiento a la nueva. | `/hernia-de-disco/` → `/blog/hernia-de-disco/` |
| **302** | Mudanza **temporal**. Casi nunca la usamos (solo WordPress la usa para el inicio de sesión). | `/wp-admin/` → inicio de sesión |
| **404** | La página no existe y no hay una equivalente. | `/pagina-que-no-existe/` |
| **410** | La página existió y se retiró a propósito, sin reemplazo. Opcional; un 404 también sirve. | Un artículo retirado sin sustituto |

Regla de oro: **si hay una página equivalente, 301 a ella. Si no la hay, 404.** Nunca mandes todo al inicio: Google trata eso como un 404 disfrazado («soft 404»).

## 2. Estado actual (revisado el 19 de noviembre de 2026)

Lo que ya funciona bien:

- Una dirección inexistente responde **404** real, con el menú del sitio y título «No se encontró la página».
- `http://` y `www.` redirigen con **301** a `https://drcolumnavertebral.com/`.
- Sin diagonal final (`/blog/hernia-de-disco`) redirige con **301** a la versión con diagonal.
- WordPress adivina direcciones cortas o incompletas y redirige con 301 (por ejemplo `/discectomia/` → `/procedimientos/discectomia/`). Es útil, pero **no es un sistema de redirecciones**: no se controla y puede adivinar mal.

Pendientes detectados:

- ~~No hay registro de redirecciones~~ **Resuelto**: existe `docs/redirecciones.csv` y Redirection está instalado. No existe un lugar donde se anote qué dirección vieja va a cuál nueva. Este protocolo lo crea: [`docs/redirecciones.csv`](redirecciones.csv).
- ~~Páginas de ejemplo de WordPress publicadas~~ **Resuelto el 19 de noviembre de 2026**: «Hello world!» y «Sample Page» se mandaron a la papelera (se pueden restaurar). `/hello-world/`, `/sample-page/`, `/?p=1` y `/?page_id=2` ya responden 404.
- ~~La página 404 no orienta al paciente~~ **Resuelto en el tema 1.5.3** (ver sección 8).
- ~~El título del 404 sin acento~~ **Resuelto en el tema 1.5.3**: «Página no encontrada | Dr. Iván del Castillo». El nombre del sitio en Ajustes → Generales se corrigió a «Dr. Iván del Castillo» el 22 de noviembre de 2026.
- ~~Feeds de comentarios~~ **Resuelto en el tema 1.5.5**: `/comments/feed/` y `/<página>/feed/` responden 404 directo (el sitio no usa comentarios). Search Console los marcaba como «Rastreada: actualmente sin indexar»; no hace falta desindexarlos, Google los suelta solo. El feed principal `/feed/` sigue activo.
- ~~Mayúsculas~~ **Resuelto en el tema 1.5.8**: cualquier ruta de página con mayúsculas (`/BLOG/hernia-de-disco/`) responde 301 a su versión en minúsculas, conservando la consulta. Archivos (con punto) y `/wp-…` no se tocan.
- **Cloudflare guarda los 404 por 31 días** (`cache-control: max-age=2678400`). Si se crea una página o una redirección en una dirección que ya dio 404, hay que **vaciar la caché** o seguirá viéndose el 404.
- `404.html` del repositorio es la vista previa de GitHub Pages; **no se usa en WordPress** (allá la página de error sale de `index.php` del tema).

## 3. Cuándo hace falta una redirección 301

Siempre que una dirección que ya estuvo publicada deje de existir:

1. **Cambias el slug** de una página (por ejemplo `/blog/lumbalgia/` → `/blog/dolor-lumbar/`).
2. **Mueves una página de sección** (de `/blog/` a `/columna/`, por ejemplo).
3. **Unes dos páginas en una**: la que desaparece se redirige a la que queda.
4. **Retiras una página que tiene una equivalente** (un artículo viejo reemplazado por uno nuevo).
5. **Direcciones del sitio anterior** del doctor que sigan apareciendo en Google, redes o enlaces de otros sitios.

No hace falta redirección cuando:

- La página nunca estuvo publicada (borradores, vista previa de GitHub).
- Se retira sin reemplazo: que dé 404 (o 410).
- Es una dirección inventada o de robots (`/wp-login.php.bak`, `/.env`, etc.): que dé 404 y no se anota.

## 4. Cómo crear una redirección

1. **Antes de cambiar nada**, anota la redirección en [`docs/redirecciones.csv`](redirecciones.csv):
   - `origen`: la dirección vieja, relativa, empezando y terminando en `/` (sin dominio, sin `/#`).
   - `destino`: la dirección nueva, igual de relativa. Debe existir y responder 200.
   - `codigo`: `301`.
   - `fecha`, `motivo`.
2. Revisa que **no haya cadenas** (A → B y B → C). Si las hay, cambia A para que vaya directo a C.
3. Revisa que **no haya bucles** (A → B y B → A).
4. Commit y push a `main` (regla 2 de AGENTS.md).
5. Aplica la redirección en WordPress (ver sección 5).
6. Actualiza los **enlaces internos** del sitio para que apunten a la dirección nueva, no a la vieja. Una redirección es para visitantes de fuera; adentro, enlace directo.
7. Publica el tema si cambiaste enlaces (pasos de «Cómo publicar en WordPress» en AGENTS.md).
8. **Vacía la caché** (barra superior de WordPress → Vaciar caché).
9. Verifica (sección 7).

## 5. Dónde se aplican las redirecciones en WordPress

Método aprobado: el plugin **Redirection** (de John Godley, gratuito; instalado el 22 de noviembre de 2026, versión 5.10.1, con registro de 404 y vigilancia de cambios de enlaces, sin guardar IP), porque además registra los 404 que reciben visitas.

- Herramientas → Redirection → Añadir nueva: URL de origen, URL de destino, tipo **301**.
- El archivo `docs/redirecciones.csv` se puede importar en Redirection → Importar/Exportar, para no teclear una por una.
- El CSV del repositorio es la fuente de verdad: si una redirección existe en WordPress y no en el CSV, se agrega al CSV.

Annie instala el plugin e inicia sesión; el asistente no escribe contraseñas.

No uses para redirecciones: `.htaccess` a mano, reglas de Cloudflare, ni JavaScript o `<meta refresh>` en la página. Quedan escondidas y nadie las encuentra después.

## 6. Cuando aparece un 404

Fuentes donde se detectan:

- **Search Console** → Páginas → «No se ha encontrado (404)».
- **Redirection** → 404s (cuando esté instalado).
- Avisos de pacientes o del doctor («este enlace no abre»).

Para cada dirección:

1. ¿Tiene visitas o enlaces de otros sitios? Si es un robot o una dirección inventada, se ignora.
2. ¿Existe una página equivalente en el sitio? → 301 a ella siguiendo la sección 4.
3. ¿El enlace roto está **dentro** del sitio? → corrige el enlace en el repositorio; no basta con redirigir.
4. ¿No hay equivalente? → se deja en 404. En Search Console no es un error que haya que «arreglar».

Frecuencia: revisar Search Console y la lista de 404 **una vez al mes**, y siempre después de cambiar slugs o publicar el tema.

## 7. Cómo verificar

Desde la terminal, para cada redirección (debe decir `301` y la dirección nueva):

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://drcolumnavertebral.com/direccion-vieja/
```

Y el destino debe decir `200` con un solo salto:

```bash
curl -sL -o /dev/null -w "%{http_code} saltos=%{num_redirects}\n" https://drcolumnavertebral.com/direccion-vieja/
```

Una dirección inexistente debe seguir dando `404` (no `200` ni `301` al inicio):

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://drcolumnavertebral.com/esta-pagina-no-existe-123/
```

Además:

- Abre la dirección vieja en computadora y en celular (375 px) y confirma que llega a la página correcta.
- El sitemap (`/sitemap.xml`) no debe incluir direcciones de origen de redirecciones; ver [`docs/SITEMAP.md`](SITEMAP.md).
- En Search Console, usa «Inspeccionar URL» en la dirección nueva y pide indexación si es una página importante.

## 8. Anuncio de la página 404

Publicado el 19 de noviembre de 2026 en el tema 1.5.3 (`index.php`, bloque `else`; título y `noindex` en `functions.php`). Verificado: código 404, `noindex, follow`, título con acento y sin desbordes a 375 px. El anuncio es este (también en `404.html`, la vista previa):

> **No encontramos esta página**
>
> Es posible que la dirección haya cambiado o que el enlace tenga un error. Revisa la dirección o elige una de estas secciones.
>
> - Inicio (`/`)
> - Padecimientos de columna (`/columna/`)
> - Blog (`/blog/`)
> - Contacto y citas (`/contacto/`)
>
> Si llegaste aquí desde un enlace del sitio, escríbenos al 55 7533 9867 para corregirlo.

Debajo se mantienen el recuadro de primera consulta y el aviso «Cuándo acudir a urgencias».

En WordPress va en el bloque `else` de `index.php` del tema (o en un `404.php` propio). Reglas:

- Código **404** real (nunca 200) y `noindex`.
- Título de la pestaña: «Página no encontrada | Dr. Iván del Castillo» (con acento).
- Colores de marca, sin flechas en botones ni enlaces, enlaces internos en la misma pestaña.
- Revisar en computadora y en celular (375 px) sin desbordes.
