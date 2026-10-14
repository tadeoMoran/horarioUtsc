import { ErrorHttp } from '../middleware/errores.js';
import * as clases from '../repositorios/clases.js';
import * as historial from '../repositorios/historial.js';
import { exigirAccesoGrupo } from './acceso.js';

const exigirRangoValido = (inicio, fin) => {
  // HH:MM ordena igual como texto que como hora.
  if (fin <= inicio) throw new ErrorHttp(400, 'La hora de fin debe ser posterior a la de inicio');
};

const exigirSinTraslape = async (db, datos) => {
  if (await clases.hayTraslape(db, datos)) {
    throw new ErrorHttp(409, 'Ya hay otra clase de este grupo en ese horario');
  }
};

const describir = (c) => `${c.materia} · día ${c.dia_semana} · ${c.hora_inicio}-${c.hora_fin}`;

export const crearClase = async (db, adminId, datos) => {
  await exigirAccesoGrupo(db, adminId, datos.grupo_id);
  exigirRangoValido(datos.hora_inicio, datos.hora_fin);
  await exigirSinTraslape(db, {
    grupoId: datos.grupo_id,
    dia: datos.dia_semana,
    inicio: datos.hora_inicio,
    fin: datos.hora_fin,
  });

  const claseId = await db.transaction(async (tx) => {
    const materiaId = await clases.obtenerOCrearMateria(tx, datos.materia, datos.docente);
    const id = await clases.insertar(tx, {
      grupoId: datos.grupo_id,
      materiaId,
      dia: datos.dia_semana,
      inicio: datos.hora_inicio,
      fin: datos.hora_fin,
      aula: datos.aula,
    });
    await historial.registrar(tx, {
      grupoId: datos.grupo_id,
      claseId: id,
      administradorId: adminId,
      campo: 'creada',
      nuevo: describir(datos),
    });
    return id;
  });
  return clases.buscarPorId(db, claseId);
};

export const actualizarClase = async (db, adminId, claseId, cambios) => {
  const actual = await clases.buscarPorId(db, claseId);
  if (!actual) throw new ErrorHttp(404, 'Clase no encontrada');
  await exigirAccesoGrupo(db, adminId, actual.grupo_id);

  const nuevo = {
    materia: cambios.materia ?? actual.materia,
    dia_semana: cambios.dia_semana ?? actual.dia_semana,
    hora_inicio: cambios.hora_inicio ?? actual.hora_inicio,
    hora_fin: cambios.hora_fin ?? actual.hora_fin,
    aula: cambios.aula ?? actual.aula,
  };
  const aulaCambio = nuevo.aula !== actual.aula;
  // Cambiar el aula marca la clase como cambiada, salvo que el administrador indique otro estado
  // o la clase ya esté cancelada.
  nuevo.estado =
    cambios.estado ?? (aulaCambio && actual.estado === 'normal' ? 'aula_cambiada' : actual.estado);

  exigirRangoValido(nuevo.hora_inicio, nuevo.hora_fin);
  const cambioHorario = ['dia_semana', 'hora_inicio', 'hora_fin'].some(
    (campo) => nuevo[campo] !== actual[campo],
  );
  if (cambioHorario) {
    await exigirSinTraslape(db, {
      grupoId: actual.grupo_id,
      dia: nuevo.dia_semana,
      inicio: nuevo.hora_inicio,
      fin: nuevo.hora_fin,
      ignorarId: claseId,
    });
  }

  await db.transaction(async (tx) => {
    const materiaId =
      nuevo.materia === actual.materia
        ? actual.materia_id
        : await clases.obtenerOCrearMateria(tx, nuevo.materia);
    await clases.actualizar(tx, claseId, {
      materiaId,
      dia: nuevo.dia_semana,
      inicio: nuevo.hora_inicio,
      fin: nuevo.hora_fin,
      aula: nuevo.aula,
      estado: nuevo.estado,
    });
    for (const campo of ['materia', 'dia_semana', 'hora_inicio', 'hora_fin', 'aula', 'estado']) {
      if (nuevo[campo] === actual[campo]) continue;
      await historial.registrar(tx, {
        grupoId: actual.grupo_id,
        claseId,
        administradorId: adminId,
        campo,
        anterior: String(actual[campo]),
        nuevo: String(nuevo[campo]),
      });
    }
  });
  return clases.buscarPorId(db, claseId);
};

export const eliminarClase = async (db, adminId, claseId) => {
  const actual = await clases.buscarPorId(db, claseId);
  if (!actual) throw new ErrorHttp(404, 'Clase no encontrada');
  await exigirAccesoGrupo(db, adminId, actual.grupo_id);

  await db.transaction(async (tx) => {
    await historial.registrar(tx, {
      grupoId: actual.grupo_id,
      claseId: null,
      administradorId: adminId,
      campo: 'eliminada',
      anterior: describir(actual),
    });
    await clases.eliminar(tx, claseId);
  });
};
