import { PGlite } from '@electric-sql/pglite';
import { readdir, readFile } from 'node:fs/promises';

const carpeta = new URL('../../migrations/', import.meta.url);

// Base Postgres en memoria con el esquema real, para probar la API sin servidor ni credenciales.
export const crearDbDePrueba = async () => {
  const pg = new PGlite();
  const archivos = (await readdir(carpeta)).filter((f) => f.endsWith('.sql')).sort();
  for (const archivo of archivos) {
    const sql = await readFile(new URL(archivo, carpeta), 'utf8');
    await pg.exec(sql.split('-- Down Migration')[0].replace('-- Up Migration', ''));
  }

  return {
    query: (texto, params) => pg.query(texto, params),
    transaction: (fn) =>
      pg.transaction((tx) => fn({ query: (texto, params) => tx.query(texto, params) })),
    cerrar: () => pg.close(),
  };
};
