import bcrypt from 'bcryptjs';
import request from 'supertest';
import { crearApp } from '../src/app.js';
import { cargarConfig } from '../src/config/env.js';
import { crearDbDePrueba } from './helpers/db-pglite.js';

let db;
let app;
let token;

const config = cargarConfig({
  DATABASE_URL: 'sin-uso-en-pruebas',
  JWT_SECRET: 'secreto-de-pruebas-0123456789',
  NODE_ENV: 'test',
});

const claseBase = {
  grupo_id: 1,
  materia: 'Bases de Datos',
  dia_semana: 2,
  hora_inicio: '08:40',
  hora_fin: '10:20',
  aula: 'Aula 7',
};

const auth = () => ({ Authorization: `Bearer ${token}` });

beforeAll(async () => {
  db = await crearDbDePrueba();
  app = crearApp({ db, config });

  await db.query(
    "INSERT INTO carrera (nombre) VALUES ('Ing. en Desarrollo y Gestión de Software')",
  );
  await db.query(
    "INSERT INTO grupo (carrera_id, cuatrimestre, letra) VALUES (1, 10, 'B'), (1, 10, 'A')",
  );
  const hash = await bcrypt.hash('contrasena-segura-1', 4);
  await db.query(
    "INSERT INTO administrador (nombre, correo, contrasena_hash) VALUES ('Docente Prueba', 'docente@ejemplo.com', $1)",
    [hash],
  );
  await db.query('INSERT INTO administrador_grupo (administrador_id, grupo_id) VALUES (1, 1)');

  const res = await request(app)
    .post('/api/auth/login')
    .send({ correo: 'Docente@Ejemplo.com', contrasena: 'contrasena-segura-1' });
  token = res.body.token;
});

afterAll(() => db.cerrar());

describe('autenticación', () => {
  test('login correcto devuelve token', () => {
    expect(token).toEqual(expect.any(String));
  });

  test('login con contraseña incorrecta es 401 sin revelar si el correo existe', async () => {
    const mal = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'docente@ejemplo.com', contrasena: 'incorrecta' });
    const inexistente = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'nadie@ejemplo.com', contrasena: 'incorrecta' });
    expect(mal.status).toBe(401);
    expect(inexistente.body).toEqual(mal.body);
  });

  test('las rutas de administración exigen token', async () => {
    expect((await request(app).get('/api/admin/grupos')).status).toBe(401);
    const falso = await request(app).get('/api/admin/grupos').set('Authorization', 'Bearer falso');
    expect(falso.status).toBe(401);
  });
});

describe('administración de clases', () => {
  test('lista solo los grupos del administrador', async () => {
    const res = await request(app).get('/api/admin/grupos').set(auth());
    expect(res.body.map((g) => g.id)).toEqual([1]);
  });

  test('crea una clase y la muestra en el horario público', async () => {
    const crear = await request(app).post('/api/admin/clases').set(auth()).send(claseBase);
    expect(crear.status).toBe(201);
    expect(crear.body).toMatchObject({
      materia: 'Bases de Datos',
      hora_inicio: '08:40',
      estado: 'normal',
    });

    const horario = await request(app).get('/api/grupos/1/horario?dia=2');
    expect(horario.body.clases).toHaveLength(1);
  });

  test('rechaza horarios traslapados (409) y rangos invertidos (400)', async () => {
    const traslape = await request(app)
      .post('/api/admin/clases')
      .set(auth())
      .send({ ...claseBase, materia: 'Inglés', hora_inicio: '09:00', hora_fin: '10:30' });
    expect(traslape.status).toBe(409);

    const invertido = await request(app)
      .post('/api/admin/clases')
      .set(auth())
      .send({ ...claseBase, materia: 'Inglés', hora_inicio: '12:00', hora_fin: '11:00' });
    expect(invertido.status).toBe(400);
  });

  test('valida el formato de los datos', async () => {
    const res = await request(app)
      .post('/api/admin/clases')
      .set(auth())
      .send({ ...claseBase, hora_inicio: '8:40' });
    expect(res.status).toBe(400);
    expect(res.body.detalle[0].campo).toBe('hora_inicio');
  });

  test('no permite operar sobre un grupo ajeno (403)', async () => {
    const res = await request(app)
      .post('/api/admin/clases')
      .set(auth())
      .send({ ...claseBase, grupo_id: 2 });
    expect(res.status).toBe(403);
  });

  test('cambiar el aula marca la clase como cambiada y guarda el aula anterior', async () => {
    const res = await request(app)
      .patch('/api/admin/clases/1')
      .set(auth())
      .send({ aula: 'Aula 12' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ aula: 'Aula 12', estado: 'aula_cambiada' });

    const detalle = await request(app).get('/api/clases/1');
    expect(detalle.body.aula_anterior).toBe('Aula 7');
  });

  test('cancelar una clase queda en el historial del grupo', async () => {
    await request(app).patch('/api/admin/clases/1').set(auth()).send({ estado: 'cancelada' });
    const historial = await request(app).get('/api/admin/grupos/1/historial').set(auth());
    const campos = historial.body.map((h) => h.campo);
    expect(campos).toEqual(expect.arrayContaining(['creada', 'aula', 'estado']));
    expect(historial.body[0]).toMatchObject({
      campo: 'estado',
      valor_nuevo: 'cancelada',
      administrador: 'Docente Prueba',
    });
  });

  test('un cambio vacío es 400 y una clase inexistente es 404', async () => {
    expect((await request(app).patch('/api/admin/clases/1').set(auth()).send({})).status).toBe(400);
    expect(
      (await request(app).patch('/api/admin/clases/99').set(auth()).send({ aula: 'X' })).status,
    ).toBe(404);
  });

  test('eliminar una clase conserva el rastro en el historial', async () => {
    const nueva = await request(app)
      .post('/api/admin/clases')
      .set(auth())
      .send({
        ...claseBase,
        materia: 'Inglés',
        hora_inicio: '10:30',
        hora_fin: '12:10',
        aula: 'Aula 5',
      });
    const borrar = await request(app).delete(`/api/admin/clases/${nueva.body.id}`).set(auth());
    expect(borrar.status).toBe(204);

    const historial = await request(app).get('/api/admin/grupos/1/historial').set(auth());
    expect(historial.body[0]).toMatchObject({ campo: 'eliminada', clase_id: null });
  });
});

describe('avisos y dispositivos', () => {
  test('publica un aviso y lo lista públicamente', async () => {
    const res = await request(app)
      .post('/api/admin/avisos')
      .set(auth())
      .send({ grupo_id: 1, clase_id: 1, tipo: 'clase_cancelada', mensaje: 'No habrá clase hoy.' });
    expect(res.status).toBe(201);

    const lista = await request(app).get('/api/grupos/1/avisos');
    expect(lista.body[0]).toMatchObject({
      tipo: 'clase_cancelada',
      mensaje: 'No habrá clase hoy.',
    });
  });

  test('no acepta una clase de otro grupo en el aviso', async () => {
    const res = await request(app)
      .post('/api/admin/avisos')
      .set(auth())
      .send({ grupo_id: 1, clase_id: 999, tipo: 'general', mensaje: 'Hola' });
    expect(res.status).toBe(400);
  });

  test('registra un dispositivo y es idempotente por token', async () => {
    const cuerpo = { grupo_id: 1, token_push: 'ExponentPushToken[abc123]' };
    expect((await request(app).post('/api/dispositivos').send(cuerpo)).status).toBe(204);
    expect(
      (
        await request(app)
          .post('/api/dispositivos')
          .send({ ...cuerpo, grupo_id: 2 })
      ).status,
    ).toBe(204);
    const { rows } = await db.query('SELECT grupo_id FROM dispositivo');
    expect(rows).toEqual([{ grupo_id: 2 }]);
  });

  test('rechaza tokens que no son de Expo', async () => {
    const res = await request(app)
      .post('/api/dispositivos')
      .send({ grupo_id: 1, token_push: 'cualquier-cosa' });
    expect(res.status).toBe(400);
  });
});

describe('consulta pública', () => {
  test('salud, catálogo y errores 404', async () => {
    expect((await request(app).get('/api/salud')).body).toEqual({ estado: 'ok' });
    expect((await request(app).get('/api/carreras')).body).toHaveLength(1);
    expect((await request(app).get('/api/grupos?carrera_id=1')).body).toHaveLength(2);
    expect((await request(app).get('/api/grupos/99/horario')).status).toBe(404);
    expect((await request(app).get('/api/no-existe')).status).toBe(404);
  });
});

describe('importación de clases', () => {
  const fila = (materia, inicio, fin, extra = {}) => ({
    materia,
    dia_semana: 5,
    hora_inicio: inicio,
    hora_fin: fin,
    aula: 'Aula 1',
    ...extra,
  });
  const importar = (filas, extra = {}) =>
    request(app)
      .post('/api/admin/clases/importar')
      .set(auth())
      .send({ grupo_id: 1, filas, ...extra });
  const contarViernes = async () =>
    (await db.query('SELECT count(*)::int AS n FROM clase WHERE dia_semana = 5')).rows[0].n;

  test('solo_validar no guarda nada', async () => {
    const res = await importar([fila('Álgebra', '07:00', '08:40')], { solo_validar: true });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ guardadas: false, correctas: 1, errores: [] });
    expect(await contarViernes()).toBe(0);
  });

  test('importa varias clases y las deja en el historial', async () => {
    const res = await importar([
      fila('Álgebra', '07:00', '08:40', { docente: 'Docente de ejemplo' }),
      fila('Física', '08:40', '10:20'),
    ]);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ guardadas: true, correctas: 2 });
    expect(await contarViernes()).toBe(2);

    const historial = await request(app).get('/api/admin/grupos/1/historial').set(auth());
    expect(historial.body[0].valor_nuevo).toContain('importada');
  });

  test('con un solo error no se guarda ninguna fila (todo o nada)', async () => {
    const antes = await contarViernes();
    const res = await importar([
      fila('Química', '10:30', '12:10'),
      fila('Dibujo', '07:30', '09:00'), // traslapa con Álgebra ya guardada
      fila('Inglés', '13:00', '12:00'), // rango invertido
      fila('Arte', '9:00', '10:00'), // formato de hora
    ]);
    expect(res.status).toBe(422);
    expect(res.body.correctas).toBe(1);
    expect(res.body.errores.map((e) => e.indice)).toEqual([1, 2, 3]);
    expect(res.body.errores[0].mensaje).toContain('Álgebra');
    expect(await contarViernes()).toBe(antes);
  });

  test('detecta traslapes entre las propias filas del archivo', async () => {
    const res = await importar([
      fila('Música', '15:00', '16:40'),
      fila('Teatro', '16:00', '17:00'),
    ]);
    expect(res.status).toBe(422);
    expect(res.body.errores).toHaveLength(1);
    expect(res.body.errores[0].indice).toBe(1);
  });

  test('exige permiso sobre el grupo y respeta el máximo de filas', async () => {
    const ajeno = await request(app)
      .post('/api/admin/clases/importar')
      .set(auth())
      .send({ grupo_id: 2, filas: [fila('X', '07:00', '08:00')] });
    expect(ajeno.status).toBe(403);

    const demasiadas = await importar(
      Array.from({ length: 301 }, (_, i) => fila(`M${i}`, '07:00', '08:00')),
    );
    expect(demasiadas.status).toBe(400);
    expect((await request(app).post('/api/admin/clases/importar').send({})).status).toBe(401);
  });
});
