import { Platform } from 'react-native';
import { calcularDisparo, firmaDe, MINUTOS_ANTES } from '@/utilidades/recordatorios';
import { borrar, guardar, leer } from './almacenamiento';

const CLAVE = 'recordatorios'; // { [claseId]: { id: identificador de la notificación, firma } }
const CANAL = 'recordatorios';

// expo-notifications se carga bajo demanda: en algunas versiones de Expo Go falta un módulo
// nativo y un import directo tumbaría la app completa. Sin el módulo, solo se desactivan
// los recordatorios.
let modulo;
const notificaciones = () => {
  if (modulo === undefined) {
    try {
      // eslint-disable-next-line no-undef -- Metro resuelve require en la app
      modulo = require('expo-notifications');
    } catch {
      modulo = null;
    }
  }
  return modulo;
};

export const NO_DISPONIBLE = 'NOTIFICACIONES_NO_DISPONIBLES';

// Con la app abierta, también se muestra el aviso.
export const configurarNotificaciones = () => {
  notificaciones()?.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
};

const asegurarCanal = async () => {
  const Notifications = notificaciones();
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CANAL, {
    name: 'Recordatorios de clase',
    importance: Notifications.AndroidImportance.HIGH,
  });
};

export const pedirPermiso = async () => {
  const Notifications = notificaciones();
  if (!Notifications) throw new Error(NO_DISPONIBLE);
  await asegurarCanal();
  const actual = await Notifications.getPermissionsAsync();
  if (actual.status === 'granted') return true;
  if (!actual.canAskAgain) return false;
  const pedido = await Notifications.requestPermissionsAsync();
  return pedido.status === 'granted';
};

const leerTodos = async () => (await leer(CLAVE)) ?? {};

export const hayRecordatorio = async (claseId) => Boolean((await leerTodos())[claseId]);

const programar = async (clase) => {
  const Notifications = notificaciones();
  const disparo = calcularDisparo(clase);
  return Notifications.scheduleNotificationAsync({
    content: {
      title: `${clase.materia} en ${MINUTOS_ANTES} min`,
      body: `${clase.hora_inicio} · ${clase.aula}`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      channelId: CANAL,
      ...disparo,
    },
  });
};

const cancelar = async (identificador) => {
  try {
    await notificaciones().cancelScheduledNotificationAsync(identificador);
  } catch {
    // Si ya no existe, no hay nada que cancelar.
  }
};

// Devuelve false si el usuario no concedió el permiso.
export const activarRecordatorio = async (clase) => {
  if (!(await pedirPermiso())) return false;
  const todos = await leerTodos();
  if (todos[clase.id]) await cancelar(todos[clase.id].id);
  todos[clase.id] = { id: await programar(clase), firma: firmaDe(clase) };
  await guardar(CLAVE, todos);
  return true;
};

export const desactivarRecordatorio = async (claseId) => {
  const todos = await leerTodos();
  if (todos[claseId]) await cancelar(todos[claseId].id);
  delete todos[claseId];
  await guardar(CLAVE, todos);
};

export const cancelarTodosLosRecordatorios = async () => {
  try {
    await notificaciones().cancelAllScheduledNotificationsAsync();
  } catch {
    // Sin permiso o sin soporte no hay nada que cancelar.
  }
  await borrar(CLAVE);
};

// Cuando el horario cambia en el servidor, los recordatorios se ajustan solos:
// se quitan los de clases eliminadas o canceladas y se reprograman los de clases movidas.
export const sincronizarRecordatorios = async (clases) => {
  if (!notificaciones()) return;
  const todos = await leerTodos();
  let cambio = false;

  for (const [claseId, guardado] of Object.entries(todos)) {
    const clase = clases.find((c) => String(c.id) === claseId);
    if (!clase || clase.estado === 'cancelada') {
      await cancelar(guardado.id);
      delete todos[claseId];
      cambio = true;
    } else if (guardado.firma !== firmaDe(clase)) {
      await cancelar(guardado.id);
      todos[claseId] = { id: await programar(clase), firma: firmaDe(clase) };
      cambio = true;
    }
  }
  if (cambio) await guardar(CLAVE, todos);
};
