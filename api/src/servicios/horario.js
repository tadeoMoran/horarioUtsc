import { ErrorHttp } from '../middleware/errores.js';
import * as catalogo from '../repositorios/catalogo.js';
import * as clases from '../repositorios/clases.js';

export const obtenerHorario = async (db, grupoId, dia) => {
  if (!(await catalogo.existeGrupo(db, grupoId))) throw new ErrorHttp(404, 'Grupo no encontrado');
  return { grupo_id: grupoId, clases: await clases.listarPorGrupo(db, grupoId, dia) };
};

export const obtenerDetalleClase = async (db, claseId) => {
  const clase = await clases.buscarPorId(db, claseId);
  if (!clase) throw new ErrorHttp(404, 'Clase no encontrada');
  // El aula anterior solo tiene sentido mientras la clase siga marcada como cambiada.
  if (clase.estado !== 'aula_cambiada') clase.aula_anterior = null;
  return clase;
};
