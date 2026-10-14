import Constants from 'expo-constants';

export class ErrorApi extends Error {
  constructor(mensaje, { sinConexion = false, estado = 0 } = {}) {
    super(mensaje);
    this.sinConexion = sinConexion;
    this.estado = estado;
  }
}

// La API gratuita de Render puede tardar hasta un minuto en despertar.
const TIEMPO_MAXIMO_MS = 65_000;

// En desarrollo, Expo ya sabe la IP de tu PC (`hostUri`): la API corre ahí, en el puerto 3000.
// En una build publicada se usa EXPO_PUBLIC_API_URL.
export const urlBase = () => {
  const definida = process.env.EXPO_PUBLIC_API_URL;
  if (definida) return definida.replace(/\/$/, '');
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:3000`;
  throw new ErrorApi('No hay una dirección de servidor configurada.');
};

// Cliente único (Singleton): ningún componente llama a fetch directamente.
export const solicitar = async (ruta, { metodo = 'GET', cuerpo } = {}) => {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_MAXIMO_MS);
  try {
    const respuesta = await fetch(`${urlBase()}/api${ruta}`, {
      method: metodo,
      headers: {
        Accept: 'application/json',
        ...(cuerpo !== undefined && { 'Content-Type': 'application/json' }),
      },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: controlador.signal,
    });
    if (respuesta.status === 204) return null;
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      throw new ErrorApi(datos.error ?? 'El servidor respondió con un error.', {
        estado: respuesta.status,
      });
    }
    return datos;
  } catch (error) {
    if (error instanceof ErrorApi) throw error;
    throw new ErrorApi('No se pudo conectar con el servidor.', { sinConexion: true });
  } finally {
    clearTimeout(temporizador);
  }
};
