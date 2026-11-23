# Agenda de citas en Google Calendar (DEMO, sin publicar)

Estado: demo en la rama `demo-agenda-google`. **No se publica hasta tener el VoBo de Annie.**

## Configuración de la agenda (cuenta de Google del doctor)

| Dato | Valor |
| --- | --- |
| Nombre | Primera consulta con el Dr. Iván del Castillo |
| Días y horario | Lunes a viernes, de 11:00 a 20:00 |
| Duración | 30 minutos |
| Tiempo entre citas | 15 minutos |
| Anticipación | Mínimo 24 horas; hasta 30 días |
| Lugar | Hospital Ángeles Metropolitano, Tlacotalpan 59, Torre Platino, consultorio 1202, Roma Sur, CDMX |
| Datos que se piden | Nombre, correo y teléfono |

Con un Gmail gratuito la agenda no revisa los otros eventos del calendario: el horario debe ser solo el libre para consultas.

## Lo que ya existe en la cuenta del doctor (revisado el 23 de noviembre de 2026)

El doctor ya tiene una agenda de citas llamada «Ivan del Castillo», y el demo usa esa:

- Citas de 60 minutos, de lunes a viernes, en el Hospital Ángeles Metropolitano.
- El formulario pide nombre, apellido y correo (no pide teléfono).
- Revisa la disponibilidad contra los calendarios Ivan, Agenda Eleonor, Docplanner y Familia, así que no encima citas.
- No se le cambió nada. Si se quiere el horario de 11 a 20 h, citas de 30 minutos o pedir teléfono, se ajusta en Google Calendar → la agenda → Editar.

## Cómo se ve en el sitio

- Computadora: al dar clic en «Ver horarios disponibles», la agenda se abre dentro de Contacto a todo el ancho.
- Celular (hasta 700 px): la agenda de Google se abre completa en otra pestaña; dentro de la página quedaba demasiado angosta.

## Para publicar (después del VoBo)

1. En Google Calendar del doctor: Crear → Agenda de citas, con los datos de arriba.
2. Compartir → Insertar en el sitio web → copiar el enlace (`https://calendar.google.com/calendar/appointments/schedules/...?gv=true`).
3. El enlace ya está en `data-gcal-src` de `contacto/index.html` (agenda «Ivan del Castillo»).
4. Publicar el tema y el plugin de cookies (`legal.json` cambió: Google Calendar en la sección 6 de privacidad).
5. Revisar en computadora y a 375 px; hacer una reserva de prueba y cancelarla.
