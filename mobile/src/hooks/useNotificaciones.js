import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { registrarDispositivoPush } from '@/servicios/notificacionesPush';
import { cargarNotificaciones } from '@/servicios/recordatorios';
import { idDeRespuesta, rutaDeNotificacion } from '@/utilidades/push';

// Si el módulo no está (Expo Go sin soporte), el hook queda inerte sin romper el orden de hooks.
const Notifications = cargarNotificaciones();
const useUltimaRespuesta = Notifications?.useLastNotificationResponse ?? (() => null);

// Push remoto: registra el teléfono en el grupo elegido y abre la pantalla correcta al tocar
// una notificación (con la app abierta, en segundo plano o cerrada).
export const useNotificaciones = (grupo) => {
  const router = useRouter();
  const respuesta = useUltimaRespuesta();
  const atendida = useRef(null);
  const grupoId = grupo?.id;

  useEffect(() => {
    if (grupoId) registrarDispositivoPush(grupoId);
  }, [grupoId]);

  useEffect(() => {
    const id = idDeRespuesta(respuesta);
    if (!grupoId || !id || atendida.current === id) return;
    atendida.current = id;
    router.push(rutaDeNotificacion(respuesta.notification.request.content.data));
  }, [respuesta, grupoId, router]);
};
