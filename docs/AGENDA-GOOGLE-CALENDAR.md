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

## Para publicar (después del VoBo)

1. En Google Calendar del doctor: Crear → Agenda de citas, con los datos de arriba.
2. Compartir → Insertar en el sitio web → copiar el enlace (`https://calendar.google.com/calendar/appointments/schedules/...?gv=true`).
3. Pegarlo en `data-gcal-src` de `contacto/index.html` (hoy dice `PEGAR_AQUI_URL_DE_GOOGLE_CON_gv=true`).
4. Publicar el tema y el plugin de cookies (`legal.json` cambió: Google Calendar en la sección 6 de privacidad).
5. Revisar en computadora y a 375 px; hacer una reserva de prueba y cancelarla.
