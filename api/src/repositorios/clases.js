const COLUMNAS = `c.id, c.grupo_id, c.dia_semana,
  to_char(c.hora_inicio, 'HH24:MI') AS hora_inicio,
  to_char(c.hora_fin, 'HH24:MI') AS hora_fin,
  c.aula, c.estado, m.id AS materia_id, m.nombre AS materia, m.docente`;

export const listarPorGrupo = async (db, grupoId, dia) => {
  const { rows } = await db.query(
    `SELECT ${COLUMNAS}
     FROM clase c JOIN materia m ON m.id = c.materia_id
     WHERE c.grupo_id = $1 AND ($2::int IS NULL OR c.dia_semana = $2)
     ORDER BY c.dia_semana, c.hora_inicio`,
    [grupoId, dia ?? null],
  );
  return rows;
};

export const buscarPorId = async (db, id) => {
  const { rows } = await db.query(
    `SELECT ${COLUMNAS},
       (SELECT h.valor_anterior FROM historial_cambio h
         WHERE h.clase_id = c.id AND h.campo = 'aula'
         ORDER BY h.fecha DESC, h.id DESC LIMIT 1) AS aula_anterior
     FROM clase c JOIN materia m ON m.id = c.materia_id
     WHERE c.id = $1`,
    [id],
  );
  return rows[0] ?? null;
};

export const hayTraslape = async (db, { grupoId, dia, inicio, fin, ignorarId }) => {
  const { rows } = await db.query(
    `SELECT 1 FROM clase
     WHERE grupo_id = $1 AND dia_semana = $2
       AND hora_inicio < $4::time AND hora_fin > $3::time
       AND ($5::int IS NULL OR id <> $5)
     LIMIT 1`,
    [grupoId, dia, inicio, fin, ignorarId ?? null],
  );
  return rows.length > 0;
};

export const obtenerOCrearMateria = async (db, nombre, docente) => {
  const { rows } = await db.query(
    `INSERT INTO materia (nombre, docente) VALUES ($1, $2)
     ON CONFLICT (nombre) DO UPDATE SET docente = COALESCE(EXCLUDED.docente, materia.docente)
     RETURNING id`,
    [nombre, docente ?? null],
  );
  return rows[0].id;
};

export const insertar = async (db, c) => {
  const { rows } = await db.query(
    `INSERT INTO clase (grupo_id, materia_id, dia_semana, hora_inicio, hora_fin, aula)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [c.grupoId, c.materiaId, c.dia, c.inicio, c.fin, c.aula],
  );
  return rows[0].id;
};

export const actualizar = async (db, id, c) => {
  await db.query(
    `UPDATE clase SET materia_id = $2, dia_semana = $3, hora_inicio = $4, hora_fin = $5,
       aula = $6, estado = $7 WHERE id = $1`,
    [id, c.materiaId, c.dia, c.inicio, c.fin, c.aula, c.estado],
  );
};

export const eliminar = async (db, id) => {
  await db.query('DELETE FROM clase WHERE id = $1', [id]);
};
