import { jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { crearApp } from '../src/app.js';
import { cargarConfig } from '../src/config/env.js';
import { notificarGrupo } from '../src/servicios/push.js';
import { crearDbDePrueba } from './helpers/db-pglite.js';

const config = cargarConfig({
  DATABASE_URL: 'sin-uso-en-pruebas',
  JWT_SECRET: 'secreto-de-pruebas-0123456789',
  NODE_ENV: 'test',
});

const TOKEN_G1_A = 'ExponentPushToken[g1-a]';
const TOKEN_G1_B = 'ExponentPushToken[g1-b]';
const TOKEN_G2 = 'ExponentPushToken[g2]';

let db;
let app;
let token;
let enviados; // lotes recibidos por el doble de Expo
let respuestaExpo; // lo que devolverá el doble en la siguiente llamada

const auth = () => ({ Authorization: `Bearer ${token}` });
const mensajesEnviados = () => enviados.flat();

const enviarFalso = async (mensajes) => {
  enviados.push(mensajes);
  if (respuestaExpo instanceof Error) throw respuestaExpo;
  return respuestaExpo ?? mensajes.map(() => ({ status: 'ok' }));
};

beforeAll(async () => {
  db = await crearDbDePrueba();
  app = crearApp({ db, config, enviar: enviarFalso });

  await db.query("INSERT INTO carrera (nombre) VALUES ('Ing. en Software')");
  await db.query(
    "INSERT INTO grupo (carrera_id, cuatrimestre, letra) VALUES (1, 10, 'B'), (1, 10, 'A')",
  );
  const hash = await bcrypt.hash('contrasena-segura-1', 4);
  await db.query(
    "INSERT INTO administrador (nombre, correo, contrasena_hash) VALUES ('Docente', 'docente@ejemplo.com', $1)",
    [hash],
  );
  await db.query('INSERT INTO administrador_grupo (administrador_id, grupo_id) VALUES (1, 1)');
  const login = await request(app)
    .post('/api/auth/login')
    .send({ correo: 'docente@ejemplo.com', contrasena: 'contrasena-segura-1' });
  token = login.body.token;
});

beforeEach(async () => {
  enviados = [];
  respuestaExpo = undefined;
  await db.query('DELETE FROM aviso');
  await db.query('DELETE FROM clase');
  await db.query('DELETE FROM dispositivo');
  await db.query(
    'INSERT INTO dispositivo (grupo_id, token_push) VALUES (1, $1), (1, $2), (2, $3)',
    [TOKEN_G1_A, TOKEN_G1_B, TOKEN_G2],
  );
});

afterAll(() => db.cerrar());

const crearClase = async () => {
  const res = await request(app).post('/api/admin/clases').set(auth()).send({
    grupo_id: 1,
    materia: 'Bases de Datos',
    dia_semana: 2,
    hora_inicio: '08:40',
    hora_fin: '10:20',
    aula: 'Aula 7',
  });
  return res.body.id;
};

const editar = (id, cuerpo) =>
  request(app).patch(`/api/admin/clases/${id}`).set(auth()).send(cuerpo);

const avisosDelGrupo = async () => (await request(app).get('/api/grupos/1/avisos')).body;

describe('aviso publicado a mano', () => {
  test('manda el push solo a los dispositivos del grupo', async () => {
    const res = await request(app)
      .post('/api/admin/avisos')
      .set(auth())
      .send({ grupo_id: 1, tipo: 'general', mensaje: 'Junta a las 12:00.' });
    expect(res.status).toBe(201);

    const mensajes = mensajesEnviados();
    expect(mensajes.map((m) => m.to)).toEqual([TOKEN_G1_A, TOKEN_G1_B]);
    expect(mensajes[0]).toMatchObject({
      title: 'Aviso',
      body: 'Junta a las 12:00.',
      data: { grupo_id: 1, aviso_id: res.body.id, tipo: 'general' },
    });
  });

  test('un grupo sin dispositivos no llama a Expo', async () => {
    await db.query('DELETE FROM dispositivo');
    const res = await request(app)
      .post('/api/admin/avisos')
      .set(auth())
      .send({ grupo_id: 1, tipo: 'general', mensaje: 'Hola' });
    expect(res.status).toBe(201);
    expect(enviados).toEqual([]);
  });

  test('si Expo falla, el aviso se guarda y la petición responde bien', async () => {
    respuestaExpo = new Error('Expo caído');
    const consola = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(app)
      .post('/api/admin/avisos')
      .set(auth())
      .send({ grupo_id: 1, tipo: 'general', mensaje: 'Sigue guardado' });
    consola.mockRestore();
    expect(res.status).toBe(201);
    expect((await avisosDelGrupo())[0].mensaje).toBe('Sigue guardado');
  });

  test('borra el token que Expo marca como no registrado', async () => {
    respuestaExpo = [
      { status: 'ok' },
      { status: 'error', details: { error: 'DeviceNotRegistered' } },
    ];
    await request(app)
      .post('/api/admin/avisos')
      .set(auth())
      .send({ grupo_id: 1, tipo: 'general', mensaje: 'Prueba' });
    const { rows } = await db.query('SELECT token_push FROM dispositivo ORDER BY id');
    expect(rows.map((r) => r.token_push)).toEqual([TOKEN_G1_A, TOKEN_G2]);
  });
});

describe('aviso automático al cambiar una clase', () => {
  test('cambiar el aula avisa con el aula nueva y la anterior', async () => {
    const id = await crearClase();
    enviados = [];
    const res = await editar(id, { aula: 'Aula 12' });
    expect(res.status).toBe(200);

    const [aviso] = await avisosDelGrupo();
    expect(aviso).toMatchObject({ tipo: 'cambio_aula', clase_id: id });
    expect(aviso.mensaje).toBe('Bases de Datos del martes ahora es en Aula 12 (antes Aula 7).');
    expect(mensajesEnviados()).toHaveLength(2);
    expect(mensajesEnviados()[0]).toMatchObject({ title: 'Cambio de aula', body: aviso.mensaje });
  });

  test('cancelar y restablecer generan un aviso cada uno', async () => {
    const id = await crearClase();
    enviados = [];
    await editar(id, { estado: 'cancelada' });
    await editar(id, { estado: 'normal' });

    const lista = await avisosDelGrupo();
    expect(lista.map((a) => a.tipo).sort()).toEqual(['clase_cancelada', 'general']);
    expect(mensajesEnviados().map((m) => m.title)).toContain('Clase cancelada');
    expect(mensajesEnviados().map((m) => m.title)).toContain('Clase restablecida');
  });

  test('cambiar aula y cancelar a la vez manda un solo aviso, el de cancelación', async () => {
    const id = await crearClase();
    enviados = [];
    await editar(id, { aula: 'Aula 3', estado: 'cancelada' });
    const lista = await avisosDelGrupo();
    expect(lista).toHaveLength(1);
    expect(lista[0].tipo).toBe('clase_cancelada');
  });

  test('cambiar el horario avisa como aviso general', async () => {
    const id = await crearClase();
    enviados = [];
    await editar(id, { hora_inicio: '09:00', hora_fin: '10:40' });
    const [aviso] = await avisosDelGrupo();
    expect(aviso).toMatchObject({ tipo: 'general' });
    expect(aviso.mensaje).toBe('Bases de Datos pasa al martes de 09:00 a 10:40.');
  });

  test('una edición sin cambios relevantes no avisa a nadie', async () => {
    const id = await crearClase();
    enviados = [];
    const res = await editar(id, { aula: 'Aula 7' });
    expect(res.status).toBe(200);
    expect(await avisosDelGrupo()).toEqual([]);
    expect(enviados).toEqual([]);
  });

  test('un cambio rechazado no deja aviso ni push', async () => {
    const id = await crearClase();
    enviados = [];
    const res = await editar(id, { hora_inicio: '11:00', hora_fin: '10:00', aula: 'Aula 1' });
    expect(res.status).toBe(400);
    expect(await avisosDelGrupo()).toEqual([]);
    expect(enviados).toEqual([]);
  });
});

describe('notificarGrupo', () => {
  test('divide los envíos en lotes de 100', async () => {
    const valores = Array.from({ length: 250 }, (_, i) => `('ExponentPushToken[lote-${i}]', 1)`);
    await db.query(`INSERT INTO dispositivo (token_push, grupo_id) VALUES ${valores.join(',')}`);
    enviados = [];
    const resultado = await notificarGrupo(
      { db, enviar: enviarFalso },
      { grupoId: 1, titulo: 'T', cuerpo: 'C' },
    );
    expect(enviados.map((lote) => lote.length)).toEqual([100, 100, 52]);
    expect(resultado.enviados).toBe(252);
  });
});
