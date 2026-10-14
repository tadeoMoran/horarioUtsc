import { ErrorHttp } from '../middleware/errores.js';
import * as avisos from '../repositorios/avisos.js';
import * as catalogo from '../repositorios/catalogo.js';
import * as clases from '../repositorios/clases.js';
import { exigirAccesoGrupo } from './acceso.js';

export const listarAvisos = async (db, grupoId, limite) => {
  if (!(await catalogo.existeGrupo(db, grupoId))) throw new ErrorHttp(404, 'Grupo no encontrado');
  return avisos.listarPorGrupo(db, grupoId, limite);
};

// El envío de la notificación push se agrega en la fase 5; aquí solo se guarda el aviso.
export const publicarAviso = async (db, adminId, datos) => {
  await exigirAccesoGrupo(db, adminId, datos.grupo_id);
  if (datos.clase_id) {
    const clase = await clases.buscarPorId(db, datos.clase_id);
    if (!clase || clase.grupo_id !== datos.grupo_id) {
      throw new ErrorHttp(400, 'La clase indicada no pertenece a ese grupo');
    }
  }
  return avisos.insertar(db, {
    grupoId: datos.grupo_id,
    claseId: datos.clase_id,
    administradorId: adminId,
    tipo: datos.tipo,
    mensaje: datos.mensaje,
  });
};
