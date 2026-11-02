import Constants from 'expo-constants';
import { idDeProyecto } from '@/utilidades/push';
import { horariosService } from './horariosService';
import { cargarNotificaciones, pedirPermiso } from './recordatorios';

// Devuelve el token de Expo de este teléfono, o null si no se puede (sin permiso, sin módulo,
// sin projectId, Android con Expo Go, sin red…). Nunca lanza: el push es un extra de la app.
export const obtenerTokenPush = async () => {
  const Notifications = cargarNotificaciones();
  if (!Notifications) return null;
  try {
    if (!(await pedirPermiso())) return null;
    const projectId = idDeProyecto(Constants);
    const { data } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return data;
  } catch (error) {
    console.warn('[push] no se pudo obtener el token:', error?.message ?? error);
    return null;
  }
};

// Registra este teléfono en el grupo para recibir sus avisos. Devuelve true si quedó registrado.
export const registrarDispositivoPush = async (grupoId) => {
  const token = await obtenerTokenPush();
  if (!token) return false;
  try {
    await horariosService.registrarDispositivo(grupoId, token);
    return true;
  } catch (error) {
    console.warn('[push] no se pudo registrar el dispositivo:', error?.message ?? error);
    return false;
  }
};
