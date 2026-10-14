// Aplica las migraciones y el seed sobre un Postgres en memoria (PGlite) para
// comprobar que el SQL es válido sin necesitar un servidor ni credenciales.
import { PGlite } from '@electric-sql/pglite';
import { readdir, readFile } from 'node:fs/promises';

const carpeta = new URL('../migrations/', import.meta.url);

const separar = (sql) => {
  const [up, down] = sql.split('-- Down Migration');
  return { up: up.replace('-- Up Migration', ''), down };
};

const main = async () => {
  const db = new PGlite();
  const archivos = (await readdir(carpeta)).filter((f) => f.endsWith('.sql')).sort();
  const migraciones = [];
  for (const archivo of archivos) {
    migraciones.push(separar(await readFile(new URL(archivo, carpeta), 'utf8')));
  }

  for (const { up } of migraciones) await db.exec(up);
  await db.exec(await readFile(new URL('../seeds/desarrollo.sql', import.meta.url), 'utf8'));
  const { rows } = await db.query(
    'SELECT m.nombre, c.hora_inicio, c.aula, c.estado FROM clase c JOIN materia m ON m.id = c.materia_id WHERE c.grupo_id = 1 AND c.dia_semana = 2 ORDER BY c.hora_inicio',
  );
  console.table(rows);

  // Las migraciones deben poder revertirse limpiamente, en orden inverso.
  await db.exec(
    'TRUNCATE historial_cambio, clase, materia, grupo, carrera RESTART IDENTITY CASCADE',
  );
  for (const { down } of [...migraciones].reverse()) await db.exec(down);
  const { rows: restantes } = await db.query(
    "SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'",
  );
  if (restantes[0].n !== 0) throw new Error('El Down Migration dejó tablas sin borrar');
  console.log('Esquema OK: subida, seed y reversión correctas.');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
