import { esquemas } from '../esquemas.js';
import * as clases from '../repositorios/clases.js';
import * as historial from '../repositorios/historial.js';
import { exigirAccesoGrupo } from './acceso.js';

const traslapan = (a, b) => a.inicio < b.fin && a.fin > b.inicio;

const describirIntervalo = (c) => `«${c.materia}» ${c.inicio}–${c.fin}`;

// Valida fila por fila y detecta traslapes con lo ya guardado y entre las propias filas.
// No toca la base: devuelve las filas válidas y los errores, para poder mostrar una vista previa.
export const validarFilas = async (db, grupoId, filasCrudas) => {
  const existentes = await clases.listarPorGrupo(db, grupoId);
  const porDia = new Map();
  const agregar = (dia, intervalo) => {
    if (!porDia.has(dia)) porDia.set(dia, []);
    porDia.get(dia).push(intervalo);
  };
  for (const c of existentes) {
    agregar(c.dia_semana, { materia: c.materia, inicio: c.hora_inicio, fin: c.hora_fin });
  }

  const validas = [];
  const errores = [];

  filasCrudas.forEach((cruda, indice) => {
    const resultado = esquemas.filaImportada.safeParse(cruda);
    if (!resultado.success) {
      const detalle = resultado.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      errores.push({ indice, mensaje: detalle.join('; ') });
      return;
    }

    const fila = resultado.data;
    if (fila.hora_fin <= fila.hora_inicio) {
      errores.push({ indice, mensaje: 'La hora de fin debe ser posterior a la de inicio' });
      return;
    }

    const nueva = { materia: fila.materia, inicio: fila.hora_inicio, fin: fila.hora_fin };
    const choque = (porDia.get(fila.dia_semana) ?? []).find((c) => traslapan(nueva, c));
    if (choque) {
      errores.push({ indice, mensaje: `Se traslapa con ${describirIntervalo(choque)}` });
      return;
    }

    agregar(fila.dia_semana, nueva);
    validas.push(fila);
  });

  return { validas, errores };
};

// Todo o nada: si hay un solo error no se guarda nada.
export const importarClases = async (db, adminId, { grupo_id, filas, solo_validar }) => {
  await exigirAccesoGrupo(db, adminId, grupo_id);
  const { validas, errores } = await validarFilas(db, grupo_id, filas);

  if (errores.length > 0 || solo_validar) {
    return { guardadas: false, correctas: validas.length, errores };
  }

  await db.transaction(async (tx) => {
    for (const fila of validas) {
      const materiaId = await clases.obtenerOCrearMateria(tx, fila.materia, fila.docente);
      const id = await clases.insertar(tx, {
        grupoId: grupo_id,
        materiaId,
        dia: fila.dia_semana,
        inicio: fila.hora_inicio,
        fin: fila.hora_fin,
        aula: fila.aula,
      });
      await historial.registrar(tx, {
        grupoId: grupo_id,
        claseId: id,
        administradorId: adminId,
        campo: 'creada',
        nuevo: `${fila.materia} · día ${fila.dia_semana} · ${fila.hora_inicio}-${fila.hora_fin} (importada)`,
      });
    }
  });
  return { guardadas: true, correctas: validas.length, errores: [] };
};
