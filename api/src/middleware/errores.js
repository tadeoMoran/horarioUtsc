import { ZodError } from 'zod';

export class ErrorHttp extends Error {
  constructor(estado, mensaje) {
    super(mensaje);
    this.estado = estado;
  }
}

export const rutaNoEncontrada = (_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
};

// eslint-disable-next-line no-unused-vars
export const manejarErrores = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    const detalle = error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message }));
    return res.status(400).json({ error: 'Datos inválidos', detalle });
  }
  if (error instanceof ErrorHttp) {
    return res.status(error.estado).json({ error: error.message });
  }
  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON mal formado' });
  }
  console.error(error);
  return res.status(500).json({ error: 'Error interno del servidor' });
};
