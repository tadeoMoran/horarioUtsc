import { Router } from 'express';
import { crearControladorPublico } from '../controladores/publico.js';
import { validar } from '../middleware/validar.js';
import { esquemas } from '../esquemas.js';

export const crearRutasPublicas = (contexto) => {
  const c = crearControladorPublico(contexto);
  const router = Router();

  router.get('/salud', c.salud);
  router.get('/carreras', c.carreras);
  router.get('/grupos', validar({ query: esquemas.consultaGrupos }), c.grupos);
  router.get(
    '/grupos/:id/horario',
    validar({ params: esquemas.paramsId, query: esquemas.consultaHorario }),
    c.horario,
  );
  router.get(
    '/grupos/:id/avisos',
    validar({ params: esquemas.paramsId, query: esquemas.consultaLista }),
    c.avisos,
  );
  router.get('/clases/:id', validar({ params: esquemas.paramsId }), c.detalleClase);
  router.post('/dispositivos', validar({ body: esquemas.dispositivo }), c.registrarDispositivo);

  return router;
};
