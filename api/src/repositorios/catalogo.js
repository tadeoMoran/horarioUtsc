export const listarCarreras = async (db) => {
  const { rows } = await db.query('SELECT id, nombre FROM carrera ORDER BY nombre');
  return rows;
};

export const listarGrupos = async (db, carreraId) => {
  const { rows } = await db.query(
    `SELECT g.id, g.carrera_id, c.nombre AS carrera, g.cuatrimestre, g.letra
     FROM grupo g JOIN carrera c ON c.id = g.carrera_id
     WHERE ($1::int IS NULL OR g.carrera_id = $1)
     ORDER BY c.nombre, g.cuatrimestre, g.letra`,
    [carreraId ?? null],
  );
  return rows;
};

export const existeGrupo = async (db, grupoId) => {
  const { rows } = await db.query('SELECT 1 FROM grupo WHERE id = $1', [grupoId]);
  return rows.length > 0;
};
