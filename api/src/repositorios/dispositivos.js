export const registrar = async (db, grupoId, token) => {
  await db.query(
    `INSERT INTO dispositivo (grupo_id, token_push) VALUES ($1, $2)
     ON CONFLICT (token_push) DO UPDATE SET grupo_id = EXCLUDED.grupo_id, fecha_registro = now()`,
    [grupoId, token],
  );
};
