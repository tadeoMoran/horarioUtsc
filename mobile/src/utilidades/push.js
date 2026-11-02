// Lógica pura del push remoto (sin módulos nativos), fácil de probar con Jest.

// El token de Expo pide un projectId. Sin EAS, sale de `extra.eas.projectId` de app.json
// (se agrega con `npx eas-cli init`, que es gratis y no compila nada).
export const idDeProyecto = (constants) =>
  constants?.expoConfig?.extra?.eas?.projectId ?? constants?.easConfig?.projectId ?? null;

// A dónde lleva tocar una notificación: a la clase si el aviso es de una clase, si no, a Avisos.
export const rutaDeNotificacion = (datos) => {
  const claseId = Number(datos?.clase_id);
  return Number.isInteger(claseId) && claseId > 0 ? `/clase/${claseId}` : '/avisos';
};

// Identificador de la respuesta a una notificación, para no abrirla dos veces.
export const idDeRespuesta = (respuesta) => respuesta?.notification?.request?.identifier ?? null;
