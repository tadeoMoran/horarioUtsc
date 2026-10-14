// Valida params, query y body con Zod y deja el resultado en `req.datos`.
// (En Express 5 `req.query` es de solo lectura, por eso no se reasigna.)
export const validar = (esquemas) => (req, _res, next) => {
  req.datos = {};
  for (const origen of ['params', 'query', 'body']) {
    if (esquemas[origen]) req.datos[origen] = esquemas[origen].parse(req[origen] ?? {});
  }
  next();
};
