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

// Los días se comparan en hora de Monterrey, que es como los ve quien captura.
export const listarPorGrupo = async (
  db,
  grupoId,
  { limite = 50, desde, hasta, administrador_id: administradorId, campo } = {},
) => {
  const { rows } = await db.query(
    `SELECT h.id, h.clase_id, h.campo, h.valor_anterior, h.valor_nuevo, h.fecha,
            a.nombre AS administrador
     FROM historial_cambio h JOIN administrador a ON a.id = h.administrador_id
     WHERE h.grupo_id = $1
       AND ($3::date IS NULL OR (h.fecha AT TIME ZONE 'America/Monterrey')::date >= $3::date)
       AND ($4::date IS NULL OR (h.fecha AT TIME ZONE 'America/Monterrey')::date <= $4::date)
       AND ($5::int IS NULL OR h.administrador_id = $5::int)
       AND ($6::text IS NULL OR h.campo = $6::text)
     ORDER BY h.fecha DESC, h.id DESC
     LIMIT $2`,
    [grupoId, limite, desde ?? null, hasta ?? null, administradorId ?? null, campo ?? null],
  );
  return rows;
};

// Administradores con cambios en el grupo, para llenar el filtro.
export const administradoresDelGrupo = async (db, grupoId) => {
  const { rows } = await db.query(
    `SELECT DISTINCT a.id, a.nombre
     FROM historial_cambio h JOIN administrador a ON a.id = h.administrador_id
     WHERE h.grupo_id = $1
     ORDER BY a.nombre`,
    [grupoId],
  );
  return rows;
};
