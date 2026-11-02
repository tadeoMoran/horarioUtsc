import * as dispositivos from '../repositorios/dispositivos.js';

const URL_EXPO = 'https://exp.host/--/api/v2/push/send';
// El servicio de Expo acepta hasta 100 mensajes por petición.
const TAMANO_LOTE = 100;
const TIEMPO_MAXIMO_MS = 8_000;

// Envía un lote de mensajes al servicio de Expo y devuelve un «ticket» por mensaje.
export const crearEnviadorExpo =
  ({ fetchFn = fetch, url = URL_EXPO } = {}) =>
  async (mensajes) => {
    const respuesta = await fetchFn(url, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(mensajes),
      signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
    });
    if (!respuesta.ok) throw new Error(`Expo respondió ${respuesta.status}`);
    const { data } = await respuesta.json();
    return data ?? [];
  };

const enLotes = (lista, tamano) => {
  const lotes = [];
  for (let i = 0; i < lista.length; i += tamano) lotes.push(lista.slice(i, i + tamano));
  return lotes;
};

// Manda una notificación a todos los dispositivos de un grupo. Es de mejor esfuerzo:
// si Expo falla, el aviso ya está guardado y la app lo mostrará al abrirse, así que nunca lanza.
export const notificarGrupo = async ({ db, enviar }, { grupoId, titulo, cuerpo, datos = {} }) => {
  const resultado = { enviados: 0, descartados: 0, fallidos: 0 };
  try {
    const tokens = await dispositivos.listarTokensPorGrupo(db, grupoId);
    const invalidos = [];

    for (const lote of enLotes(tokens, TAMANO_LOTE)) {
      const mensajes = lote.map((to) => ({
        to,
        title: titulo,
        body: cuerpo,
        data: { grupo_id: grupoId, ...datos },
        sound: 'default',
      }));
      try {
        const tickets = await enviar(mensajes);
        tickets.forEach((ticket, i) => {
          if (ticket?.status === 'ok') resultado.enviados += 1;
          else if (ticket?.details?.error === 'DeviceNotRegistered') invalidos.push(lote[i]);
          else resultado.fallidos += 1;
        });
      } catch (error) {
        resultado.fallidos += lote.length;
        console.error('No se pudo enviar un lote de notificaciones:', error.message);
      }
    }

    // Un token que Expo marca como no registrado (app desinstalada) no volverá a servir.
    if (invalidos.length) {
      await dispositivos.eliminarTokens(db, invalidos);
      resultado.descartados = invalidos.length;
    }
  } catch (error) {
    console.error('No se pudieron enviar las notificaciones:', error.message);
  }
  return resultado;
};

// Función que los servicios reciben: sin `enviar` (pruebas, desarrollo sin red) no hace nada.
export const crearNotificador = ({ db, enviar }) =>
  enviar ? (aviso) => notificarGrupo({ db, enviar }, aviso) : async () => {};
