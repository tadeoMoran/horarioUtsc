import { existsSync } from 'node:fs';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { manejarErrores, rutaNoEncontrada } from './middleware/errores.js';
import { crearRutasAdmin } from './rutas/admin.js';
import { crearRutasPublicas } from './rutas/publicas.js';

const CDN = 'https://cdn.jsdelivr.net';

// `webDir` es la carpeta del panel web; si aún no existe contenido, solo se sirve la API.
export const crearApp = ({ db, config, webDir }) => {
  const app = express();
  const produccion = config.NODE_ENV === 'production';

  // Detrás del proxy de Render, para que el límite de peticiones use la IP real.
  if (produccion) app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", CDN],
          styleSrc: ["'self'", CDN],
          fontSrc: ["'self'", CDN],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          // En desarrollo se sirve por http; forzar https rompería los recursos.
          upgradeInsecureRequests: produccion ? [] : null,
        },
      },
    }),
  );
  app.use(express.json({ limit: '64kb' }));

  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000,
      limit: 120,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      skip: () => config.NODE_ENV === 'test',
      message: { error: 'Demasiadas peticiones, intenta de nuevo en un momento' },
    }),
  );

  const contexto = { db, config };
  app.use('/api', crearRutasPublicas(contexto), crearRutasAdmin(contexto));
  app.use('/api', rutaNoEncontrada);

  if (webDir && existsSync(webDir)) app.use(express.static(webDir));

  app.use(manejarErrores);
  return app;
};
