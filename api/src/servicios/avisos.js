import { ErrorHttp } from '../middleware/errores.js';
import * as avisos from '../repositorios/avisos.js';
import * as catalogo from '../repositorios/catalogo.js';
import * as clases from '../repositorios/clases.js';
import { exigirAccesoGrupo } from './acceso.js';

const TITULOS = {
  cambio_aula: 'Cambio de aula',
  clase_cancelada: 'Clase cancelada',
  general: 'Aviso',
};

export const listarAvisos = async (db, grupoId, limite) => {
  if (!(await catalogo.existeGrupo(db, grupoId))) throw new ErrorHttp(404, 'Grupo no encontrado');
  return avisos.listarPorGrupo(db, grupoId, limite);
};

// Avisa al grupo por push. `titulo` solo se indica cuando el aviso nace de un cambio de clase.
export const enviarPushDeAviso = (notificar, aviso, titulo = TITULOS[aviso.tipo]) =>
  notificar({
    grupoId: aviso.grupo_id,
    titulo,
    cuerpo: aviso.mensaje,
    datos: { aviso_id: aviso.id, clase_id: aviso.clase_id, tipo: aviso.tipo },
  });

export const publicarAviso = async (db, notificar, adminId, datos) => {
  await exigirAccesoGrupo(db, adminId, datos.grupo_id);
  if (datos.clase_id) {
    const clase = await clases.buscarPorId(db, datos.clase_id);
    if (!clase || clase.grupo_id !== datos.grupo_id) {
      throw new ErrorHttp(400, 'La clase indicada no pertenece a ese grupo');
    }
  }
  const aviso = await avisos.insertar(db, {
    grupoId: datos.grupo_id,
    claseId: datos.clase_id,
    administradorId: adminId,
    tipo: datos.tipo,
    mensaje: datos.mensaje,
  });
  await enviarPushDeAviso(notificar, aviso);
  return aviso;
};
