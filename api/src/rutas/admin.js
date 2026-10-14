import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { crearControladorAdmin } from '../controladores/admin.js';
import { autenticar } from '../middleware/autenticar.js';
import { validar } from '../middleware/validar.js';
import { esquemas } from '../esquemas.js';

export const crearRutasAdmin = (contexto) => {
  const { config } = contexto;
  const c = crearControladorAdmin(contexto);
  const router = Router();

  const limiteLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => config.NODE_ENV === 'test',
    message: { error: 'Demasiados intentos, espera unos minutos' },
  });

  router.post('/auth/login', limiteLogin, validar({ body: esquemas.login }), c.login);

  router.use('/admin', autenticar(config.JWT_SECRET));
  router.get('/admin/grupos', c.misGrupos);
  router.post('/admin/clases', validar({ body: esquemas.claseNueva }), c.crearClase);
  router.post('/admin/clases/importar', validar({ body: esquemas.importacion }), c.importarClases);
  router.patch(
    '/admin/clases/:id',
    validar({ params: esquemas.paramsId, body: esquemas.claseCambios }),
    c.actualizarClase,
  );
  router.delete('/admin/clases/:id', validar({ params: esquemas.paramsId }), c.eliminarClase);
  router.post('/admin/avisos', validar({ body: esquemas.avisoNuevo }), c.publicarAviso);
  router.get(
    '/admin/grupos/:id/historial',
    validar({ params: esquemas.paramsId, query: esquemas.consultaLista }),
    c.historialGrupo,
  );

  return router;
};
