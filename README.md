# HorarioUTSC

App móvil para que los alumnos de la UTSC consulten su horario y los avisos de su grupo, y panel web para que un administrador capture las clases. Proyecto de la materia Desarrollo Móvil Integral.

Los horarios y avisos los captura un administrador. La app no está conectada al sistema de la escuela y sus avisos no son oficiales.

## Qué hay en el repositorio

| Carpeta   | Qué es                                                         |
| --------- | -------------------------------------------------------------- |
| `api/`    | API en Node.js y Express, con PostgreSQL (Neon) y migraciones. |
| `web/`    | Panel de administración en HTML, Bootstrap y JavaScript.       |
| `mobile/` | App de los alumnos en Expo (React Native).                     |

El panel web lo sirve la propia API, así que se despliega junto con ella.

## Cómo correrlo en local

Necesitas Node.js 22 o superior y una base PostgreSQL (se usa Neon).

1. Instala las dependencias: `npm install` en la raíz y `npm install` dentro de `mobile/`.
2. Copia `api/.env.example` a `api/.env` y llena `DATABASE_URL` y `JWT_SECRET`.
3. Aplica las migraciones: desde `api/`, `npx node-pg-migrate up -m migrations --migration-file-language sql --envPath .env`.
4. Crea un administrador: `npm run admin:crear --workspace api` (ver el encabezado de `api/scripts/crear-admin.mjs`).
5. Arranca la API y el panel: `npm run dev --workspace api`, y abre `http://localhost:3000`.
6. Arranca la app: `cd mobile && npx expo start` y escanea el QR con Expo Go.

## Pruebas y calidad

- `npm test --workspace api` y `cd mobile && npx jest`
- `npm run lint` y `npm run format:check`

## Notas

- Las claves y la cadena de conexión van en variables de entorno y nunca se versionan.
- El plan gratuito de Render tarda de 30 a 60 segundos en despertar tras un rato sin uso; la app muestra el último horario guardado mientras tanto.
