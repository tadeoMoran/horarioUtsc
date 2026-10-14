import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { crearApp } from './app.js';
import { crearDb } from './config/db.js';
import { cargarConfig } from './config/env.js';

const config = cargarConfig();
const db = crearDb(config.DATABASE_URL);
const webDir = fileURLToPath(new URL('../../web', import.meta.url));

const servidor = crearApp({ db, config, webDir }).listen(config.PORT, () => {
  console.log(`API de HorarioUTSC escuchando en el puerto ${config.PORT}`);
});

const cerrar = () => {
  servidor.close(async () => {
    await db.cerrar();
    process.exit(0);
  });
};
process.on('SIGTERM', cerrar);
process.on('SIGINT', cerrar);
