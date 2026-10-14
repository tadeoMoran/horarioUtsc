import { ErrorHttp } from '../middleware/errores.js';
import * as catalogo from '../repositorios/catalogo.js';
import * as dispositivos from '../repositorios/dispositivos.js';

export const registrarDispositivo = async (db, { grupo_id, token_push }) => {
  if (!(await catalogo.existeGrupo(db, grupo_id))) throw new ErrorHttp(404, 'Grupo no encontrado');
  await dispositivos.registrar(db, grupo_id, token_push);
};
