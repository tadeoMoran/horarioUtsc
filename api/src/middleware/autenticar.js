import jwt from 'jsonwebtoken';
import { ErrorHttp } from './errores.js';

export const autenticar = (secreto) => (req, _res, next) => {
  const encabezado = req.headers.authorization ?? '';
  const [tipo, token] = encabezado.split(' ');
  if (tipo !== 'Bearer' || !token) throw new ErrorHttp(401, 'Se requiere iniciar sesión');

  try {
    const { sub } = jwt.verify(token, secreto, { algorithms: ['HS256'] });
    req.admin = { id: Number(sub) };
  } catch {
    throw new ErrorHttp(401, 'Sesión inválida o vencida');
  }
  next();
};
