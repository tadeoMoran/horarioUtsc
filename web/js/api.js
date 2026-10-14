const CLAVE_SESION = 'horarioutsc.sesion';

export class ErrorApi extends Error {
  constructor(estado, mensaje, detalle = [], cuerpo = null) {
    super(mensaje);
    this.estado = estado;
    this.detalle = detalle;
    this.cuerpo = cuerpo;
  }
}

// La sesión vive en sessionStorage: se borra al cerrar la pestaña.
export const sesion = {
  obtener: () => {
    try {
      return JSON.parse(sessionStorage.getItem(CLAVE_SESION));
    } catch {
      return null;
    }
  },
  guardar: (datos) => sessionStorage.setItem(CLAVE_SESION, JSON.stringify(datos)),
  borrar: () => sessionStorage.removeItem(CLAVE_SESION),
};

const solicitar = async (ruta, { metodo = 'GET', cuerpo, conSesion = true } = {}) => {
  const encabezados = { Accept: 'application/json' };
  if (cuerpo !== undefined) encabezados['Content-Type'] = 'application/json';
  if (conSesion) encabezados.Authorization = `Bearer ${sesion.obtener()?.token ?? ''}`;

  let respuesta;
  try {
    respuesta = await fetch(`/api${ruta}`, {
      method: metodo,
      headers: encabezados,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    throw new ErrorApi(
      0,
      'No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.',
    );
  }

  if (respuesta.status === 204) return null;
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    if (respuesta.status === 401 && conSesion) {
      sesion.borrar();
      window.location.replace('index.html');
    }
    throw new ErrorApi(
      respuesta.status,
      datos.error ?? 'Ocurrió un error inesperado',
      datos.detalle,
      datos,
    );
  }
  return datos;
};

export const api = {
  iniciarSesion: (correo, contrasena) =>
    solicitar('/auth/login', { metodo: 'POST', cuerpo: { correo, contrasena }, conSesion: false }),
  misGrupos: () => solicitar('/admin/grupos'),
  horario: (grupoId) => solicitar(`/grupos/${grupoId}/horario`, { conSesion: false }),
  crearClase: (clase) => solicitar('/admin/clases', { metodo: 'POST', cuerpo: clase }),
  importarClases: (grupoId, filas, soloValidar) =>
    solicitar('/admin/clases/importar', {
      metodo: 'POST',
      cuerpo: { grupo_id: grupoId, filas, solo_validar: soloValidar },
    }),
  actualizarClase: (id, cambios) =>
    solicitar(`/admin/clases/${id}`, { metodo: 'PATCH', cuerpo: cambios }),
  eliminarClase: (id) => solicitar(`/admin/clases/${id}`, { metodo: 'DELETE' }),
  avisos: (grupoId) => solicitar(`/grupos/${grupoId}/avisos`, { conSesion: false }),
  publicarAviso: (aviso) => solicitar('/admin/avisos', { metodo: 'POST', cuerpo: aviso }),
  historial: (grupoId) => solicitar(`/admin/grupos/${grupoId}/historial`),
};
