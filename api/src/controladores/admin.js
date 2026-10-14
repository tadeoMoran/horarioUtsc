import * as administradores from '../repositorios/administradores.js';
import * as historial from '../repositorios/historial.js';
import * as avisos from '../servicios/avisos.js';
import * as auth from '../servicios/auth.js';
import * as clasesAdmin from '../servicios/clases-admin.js';
import * as importacion from '../servicios/importar-clases.js';
import { exigirAccesoGrupo } from '../servicios/acceso.js';

export const crearControladorAdmin = ({ db, config }) => ({
  login: async (req, res) => {
    res.json(await auth.iniciarSesion(db, config, req.datos.body));
  },

  misGrupos: async (req, res) => {
    res.json(await administradores.listarGrupos(db, req.admin.id));
  },

  crearClase: async (req, res) => {
    res.status(201).json(await clasesAdmin.crearClase(db, req.admin.id, req.datos.body));
  },

  importarClases: async (req, res) => {
    const resultado = await importacion.importarClases(db, req.admin.id, req.datos.body);
    const huboErrores = resultado.errores.length > 0;
    const estado = huboErrores ? 422 : resultado.guardadas ? 201 : 200;
    res.status(estado).json(resultado);
  },

  actualizarClase: async (req, res) => {
    const { id } = req.datos.params;
    res.json(await clasesAdmin.actualizarClase(db, req.admin.id, id, req.datos.body));
  },

  eliminarClase: async (req, res) => {
    await clasesAdmin.eliminarClase(db, req.admin.id, req.datos.params.id);
    res.status(204).end();
  },

  publicarAviso: async (req, res) => {
    res.status(201).json(await avisos.publicarAviso(db, req.admin.id, req.datos.body));
  },

  historialGrupo: async (req, res) => {
    const { id } = req.datos.params;
    await exigirAccesoGrupo(db, req.admin.id, id);
    res.json(await historial.listarPorGrupo(db, id, req.datos.query.limite));
  },
});
