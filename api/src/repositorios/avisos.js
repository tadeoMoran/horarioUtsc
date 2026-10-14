export const listarPorGrupo = async (db, grupoId, limite) => {
  const { rows } = await db.query(
    `SELECT id, grupo_id, clase_id, tipo, mensaje, fecha
     FROM aviso WHERE grupo_id = $1
     ORDER BY fecha DESC, id DESC LIMIT $2`,
    [grupoId, limite],
  );
  return rows;
};

export const insertar = async (db, a) => {
  const { rows } = await db.query(
    `INSERT INTO aviso (grupo_id, clase_id, administrador_id, tipo, mensaje)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, grupo_id, clase_id, tipo, mensaje, fecha`,
    [a.grupoId, a.claseId ?? null, a.administradorId, a.tipo, a.mensaje],
  );
  return rows[0];
};
