import { ErrorHttp } from '../middleware/errores.js';
import * as administradores from '../repositorios/administradores.js';

export const exigirAccesoGrupo = async (db, administradorId, grupoId) => {
  if (!(await administradores.tieneGrupo(db, administradorId, grupoId))) {
    throw new ErrorHttp(403, 'No tienes permiso sobre este grupo');
  }
};
