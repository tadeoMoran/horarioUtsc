// Crea un administrador y le asigna grupos. No existe registro público de administradores.
//
// Uso (PowerShell):
//   $env:ADMIN_CONTRASENA = "una-contraseña-larga"
//   node scripts/crear-admin.mjs "Nombre Apellido" correo@ejemplo.com 1,2
//
// La contraseña va en una variable de entorno para que no quede en el historial del shell.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { crearDb } from '../src/config/db.js';
import * as administradores from '../src/repositorios/administradores.js';
import * as catalogo from '../src/repositorios/catalogo.js';

const [nombre, correo, grupos = ''] = process.argv.slice(2);
const contrasena = process.env.ADMIN_CONTRASENA;

const main = async () => {
  if (!nombre || !correo || !contrasena) {
    throw new Error('Faltan datos: nombre, correo y la variable ADMIN_CONTRASENA');
  }
  if (contrasena.length < 10) throw new Error('La contraseña debe tener al menos 10 caracteres');

  const db = crearDb(process.env.DATABASE_URL);
  try {
    const contrasenaHash = await bcrypt.hash(contrasena, 12);
    const gruposIds = grupos.split(',').filter(Boolean).map(Number);

    for (const grupoId of gruposIds) {
      if (!(await catalogo.existeGrupo(db, grupoId))) {
        throw new Error(`El grupo ${grupoId} no existe. Carga los datos de los grupos primero.`);
      }
    }

    // Todo o nada: si algo falla, no queda un administrador a medias.
    const id = await db.transaction(async (tx) => {
      const nuevoId = await administradores.crear(tx, {
        nombre,
        correo: correo.toLowerCase(),
        contrasenaHash,
      });
      for (const grupoId of gruposIds) await administradores.asignarGrupo(tx, nuevoId, grupoId);
      return nuevoId;
    });
    console.log(`Administrador creado con id ${id}`);
  } finally {
    await db.cerrar();
  }
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
