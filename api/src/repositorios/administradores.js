export const buscarPorCorreo = async (db, correo) => {
  const { rows } = await db.query(
    'SELECT id, nombre, correo, contrasena_hash FROM administrador WHERE correo = $1',
    [correo],
  );
  return rows[0] ?? null;
};

export const crear = async (db, { nombre, correo, contrasenaHash }) => {
  const { rows } = await db.query(
    `INSERT INTO administrador (nombre, correo, contrasena_hash) VALUES ($1, $2, $3)
     RETURNING id`,
    [nombre, correo, contrasenaHash],
  );
  return rows[0].id;
};

export const asignarGrupo = async (db, administradorId, grupoId) => {
  await db.query(
    `INSERT INTO administrador_grupo (administrador_id, grupo_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [administradorId, grupoId],
  );
};

export const listarGrupos = async (db, administradorId) => {
  const { rows } = await db.query(
    `SELECT g.id, g.carrera_id, c.nombre AS carrera, g.cuatrimestre, g.letra
     FROM administrador_grupo ag
       JOIN grupo g ON g.id = ag.grupo_id JOIN carrera c ON c.id = g.carrera_id
     WHERE ag.administrador_id = $1
     ORDER BY c.nombre, g.cuatrimestre, g.letra`,
    [administradorId],
  );
  return rows;
};

export const tieneGrupo = async (db, administradorId, grupoId) => {
  const { rows } = await db.query(
    'SELECT 1 FROM administrador_grupo WHERE administrador_id = $1 AND grupo_id = $2',
    [administradorId, grupoId],
  );
  return rows.length > 0;
};
