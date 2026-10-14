export const registrar = async (
  db,
  { grupoId, claseId, administradorId, campo, anterior, nuevo },
) => {
  await db.query(
    `INSERT INTO historial_cambio
       (grupo_id, clase_id, administrador_id, campo, valor_anterior, valor_nuevo)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [grupoId, claseId ?? null, administradorId, campo, anterior ?? null, nuevo ?? null],
  );
};

export const listarPorGrupo = async (db, grupoId, limite) => {
  const { rows } = await db.query(
    `SELECT h.id, h.clase_id, h.campo, h.valor_anterior, h.valor_nuevo, h.fecha,
            a.nombre AS administrador
     FROM historial_cambio h JOIN administrador a ON a.id = h.administrador_id
     WHERE h.grupo_id = $1
     ORDER BY h.fecha DESC, h.id DESC
     LIMIT $2`,
    [grupoId, limite],
  );
  return rows;
};
