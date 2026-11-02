export const listarTokensPorGrupo = async (db, grupoId) => {
  const { rows } = await db.query(
    'SELECT token_push FROM dispositivo WHERE grupo_id = $1 ORDER BY id',
    [grupoId],
  );
  return rows.map((r) => r.token_push);
};

export const eliminarTokens = async (db, tokens) => {
  await db.query('DELETE FROM dispositivo WHERE token_push = ANY($1::text[])', [tokens]);
};

export const registrar = async (db, grupoId, token) => {
  await db.query(
    `INSERT INTO dispositivo (grupo_id, token_push) VALUES ($1, $2)
     ON CONFLICT (token_push) DO UPDATE SET grupo_id = EXCLUDED.grupo_id, fecha_registro = now()`,
    [grupoId, token],
  );
};
