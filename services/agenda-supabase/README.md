# Agenda en Supabase

> **Ubicación (18 nov 2026).** Esta carpeta vive en `services/agenda-supabase/` del repo `anniefilio/dr-ivan-del-castillo` a propósito. La integración de Supabase del proyecto `kpxchhavqhqwvsmzrbyo` usa working directory `.` y despliega desde `main`: si `supabase/` estuviera en la raíz, cada push aplicaría la migración al proyecto real. Para desplegar, primero Annie lo aprueba y se ajusta el working directory de la integración (o se mueve la carpeta) a propósito.

Implementación elegida para el servidor de agenda: **Supabase Edge Functions + Postgres**. Sustituye el borrador portable de Python. No necesita un VPS, Docker en producción ni un servidor adicional al proyecto de Supabase.

## Arquitectura

GitHub Pages presenta el calendario. La función `agenda` consulta Doctoralia y reserva desde el servidor. Las credenciales permanecen en Edge Function Secrets. Postgres registra solicitudes e impide duplicados entre distintas instancias de la función. El paciente permanece en el sitio.

Archivos:

- `supabase/functions/agenda/index.ts`: entrada de Edge Functions.
- `supabase/functions/agenda/gateway.mjs`: calendario, OAuth2, validación, firmas y reserva.
- `supabase/migrations/202611110001_private_booking.sql`: tablas y operaciones atómicas privadas.
- `supabase/config.toml`: configuración de la función pública de atención a pacientes.
- `.env.example`: nombres de variables, sin claves.

## Privacidad y permisos

Las tablas residen en `booking_private`, fuera del esquema público de datos, tienen RLS y no conceden acceso a `anon` ni `authenticated`. Las cuatro funciones RPC solo pueden ejecutarse con `service_role`, desde la Edge Function. No se envía esa clave al navegador.

Se conserva horario, estado, referencia y una huella HMAC del contacto. No se guardan nombres, correos ni teléfonos en texto. No se solicitan síntomas ni documentos. Los datos de contacto se envían a Doctoralia al reservar, por lo que el aviso de privacidad debe contemplarlo.

La función `agenda` es pública porque el paciente no inicia sesión: `verify_jwt=false` se aplica únicamente a esa función. Esto no abre las tablas ni concede acceso a datos. CORS es una restricción para navegadores, no autenticación: antes de producción añadir protección contra automatización. Existe un límite global persistente por minuto, conservador, para acotar llamadas al proveedor; debe ajustarse según tráfico y complementarse con protección por cliente.

## Lo que falta para desplegar

Se necesita identificar el proyecto de Supabase y disponer de acceso autorizado. No compartir claves en el chat. No se ha instalado la CLI, aplicado la migración, creado secretos ni desplegado funciones en una cuenta real.

Desde esta carpeta, con la CLI oficial ya instalada y autenticada por la administradora:

```sh
supabase link --project-ref IDENTIFICADOR_DEL_PROYECTO
supabase db push --dry-run
```

Revisar la migración y el estado del proyecto antes de aplicarla. El proyecto podría tener tablas, funciones y políticas existentes. No usar `db reset` sobre un proyecto existente.

Después de la revisión:

```sh
supabase db push
supabase functions deploy agenda
```

La migración crea un esquema, dos tablas y cuatro RPC con el prefijo `agenda_`. No modifica tablas del sitio ni contiene datos de pacientes. Si esos nombres ya existen, resolver el conflicto antes del despliegue; no sobrescribir funciones existentes sin revisión.

Configurar secretos desde **Edge Functions > Secrets** en Supabase. Usar la lista `.env.example`, no rellenar ni publicar ese archivo. Supabase proporciona las variables de servidor `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`. Nunca poner la clave service role en GitHub Pages. La función no requiere una clave de Supabase en el navegador.

Mantener `BOOKING_ENABLED=false` durante el primer despliegue. `/health` solo comprueba que la función responde y si está habilitada; no verifica que Doctoralia haya autorizado la cuenta.

## Configuración de Doctoralia

Requiere cliente OAuth oficial, secreto, dominio del entorno autorizado y los identificadores de sede, médico, dirección y servicio. Los IDs del widget no son válidos por suposición. Confirmar duración y correspondencia del servicio con los horarios de esa dirección en sandbox. No asumir que el acceso al perfil profesional da acceso API.

La función consulta disponibilidad, vuelve a verificar antes de enviar y confirma solo tras recibir una referencia de reserva con el mismo horario. Si la respuesta queda incierta, bloquea reintentos y oculta ese horario hasta revisión privada. No borres el registro para reintentar. El proyecto debe conservar su base de datos entre despliegues.

El adaptador está basado en la documentación pública, no validado con la cuenta real. Antes de producción comprobar respuestas y paginación, servicio, reservas, conflictos, reinicios, cancelaciones, movimientos y el alcance de callbacks/sincronización que exija Doctoralia. No declara completa una integración productiva.

## Conectar con GitHub Pages

La URL base del frontend será:

```text
https://IDENTIFICADOR.supabase.co/functions/v1/agenda
```

Se coloca, sin claves, en `data-booking-endpoint` del calendario. Los recursos son:

- `GET /availability?date=AAAA-MM-DD`
- `POST /appointments`, JSON y cabecera `Idempotency-Key`.
- `GET /health`

La función espera `Origin: https://anniefilio.github.io`, configurado en `ALLOWED_ORIGINS`. El calendario ya genera las claves de idempotencia y usa el mismo contrato. No publicar un endpoint supuesto; obtener la URL del proyecto real y probar desde el sitio antes de habilitar reservas.

GitHub comparte origen entre los proyectos de esa cuenta. Un dominio propio permite mayor aislamiento cuando se configure.

## Pruebas

`tests/gateway.test.mjs` exporta `runTests()` y usa un proveedor ficticio y un contrato RPC en memoria exclusivamente en pruebas. No reserva citas ni usa claves reales. Se puede ejecutar en un entorno Node moderno con WebCrypto y Fetch:

```sh
node --input-type=module -e "import('./tests/gateway.test.mjs').then(async m=>console.log(await m.runTests()))"
```

Verificación local: 23 comprobaciones pasan, incluyendo OAuth simulado, respuestas sin credenciales, reintentos, validación y conflictos.

Falta ejecutar la migración y probar concurrencia real en Postgres y el runtime Deno de Supabase; el simulador RPC no sustituye esas pruebas.

## Fuentes oficiales

- https://supabase.com/docs/guides/functions/secrets
- https://supabase.com/docs/guides/functions/auth
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://integrations.docplanner.com/guide/fundamentals/authorization.html
- https://integrations.docplanner.com/docs/
