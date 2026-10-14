import * as catalogo from '../repositorios/catalogo.js';
import * as avisos from '../servicios/avisos.js';
import * as dispositivos from '../servicios/dispositivos.js';
import * as horario from '../servicios/horario.js';

export const crearControladorPublico = ({ db }) => ({
  salud: async (_req, res) => {
    await db.query('SELECT 1');
    res.json({ estado: 'ok' });
  },

  carreras: async (_req, res) => {
    res.json(await catalogo.listarCarreras(db));
  },

  grupos: async (req, res) => {
    res.json(await catalogo.listarGrupos(db, req.datos.query.carrera_id));
  },

  horario: async (req, res) => {
    res.json(await horario.obtenerHorario(db, req.datos.params.id, req.datos.query.dia));
  },

  avisos: async (req, res) => {
    res.json(await avisos.listarAvisos(db, req.datos.params.id, req.datos.query.limite));
  },

  detalleClase: async (req, res) => {
    res.json(await horario.obtenerDetalleClase(db, req.datos.params.id));
  },

  registrarDispositivo: async (req, res) => {
    await dispositivos.registrarDispositivo(db, req.datos.body);
    res.status(204).end();
  },
});
