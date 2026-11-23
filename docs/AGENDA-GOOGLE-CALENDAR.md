# Agenda de citas en Google Calendar

Publicada el 23 de noviembre de 2026 en Contacto (botón «Ver horarios disponibles»). Annie dio el visto bueno.

## La agenda

La agenda de Google Calendar del doctor («Ivan del Castillo», cuenta del doctor) es **la única agenda del sitio**. Se configuró con las indicaciones de Annie:

| Dato | Valor |
| --- | --- |
| Días y horario | Lunes a viernes, de 11:00 a 20:00 (la última cita empieza a las 19:00) |
| Duración | 60 minutos |
| Anticipación | Mínimo 24 horas; hasta 21 días |
| Lugar | Hospital Ángeles Metropolitano, Torre Platino, consultorio 1202. Tlacotalpan 59, Roma Sur, 06760 Ciudad de México |
| Descripción | Consulta de ortopedia y columna, 60 minutos, $1,700 MXN (tarjeta de crédito, débito o efectivo), WhatsApp 55 7533 9867 |
| Formulario | Nombre, apellido, correo y teléfono (todos obligatorios) |
| Confirmación y recordatorio | Invitación de calendario y recordatorio por correo 1 día antes |
| Disponibilidad | Revisa los calendarios Ivan, Agenda Eleonor, Docplanner y Familia para no encimar citas |

**Doctoralia es tema del doctor: no se toca.** Doctoralia lee el Google Calendar del doctor y bloquea esas horas, así que una cita reservada en el sitio no se puede volver a reservar en Doctoralia.

## Cómo funciona en el sitio

- La agenda se muestra abierta (como el calendario de Doctoralia) en Inicio («Prepara tu visita»), Primera consulta y Contacto. Desde el 23 de noviembre de 2026 ya no hay formulario de solicitud por WhatsApp en esas páginas. En Inicio y Primera consulta usa `.gcal-embed` (assets/design.css).
- El enlace está en `data-gcal-src` de `contacto/index.html`. El código está en `assets/main.js` y el estilo en `assets/booking.css`.
- Privacidad (sección 6) y `integrations/ivan-consent/legal.json` mencionan Google Calendar.
- Lo que pasa dentro de la agenda de Google no se mide en Analytics; las reservas se ven en el calendario del doctor.
