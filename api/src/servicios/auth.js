import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ErrorHttp } from '../middleware/errores.js';
import * as administradores from '../repositorios/administradores.js';

// Hash de relleno: comparar siempre evita distinguir "correo inexistente" por tiempo de respuesta.
const HASH_RELLENO = bcrypt.hashSync('relleno-sin-uso', 10);

export const iniciarSesion = async (db, config, { correo, contrasena }) => {
  const admin = await administradores.buscarPorCorreo(db, correo);
  const valido = await bcrypt.compare(contrasena, admin?.contrasena_hash ?? HASH_RELLENO);
  if (!admin || !valido) throw new ErrorHttp(401, 'Correo o contraseña incorrectos');

  const token = jwt.sign({ sub: String(admin.id) }, config.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '8h',
  });
  return { token, administrador: { id: admin.id, nombre: admin.nombre, correo: admin.correo } };
};
