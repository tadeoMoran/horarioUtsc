import { solicitar } from './clienteApi';

// Capa de servicio (Repository): concentra las llamadas a la API.
export const horariosService = {
  grupos: () => solicitar('/grupos'),
  horario: async (grupoId) => (await solicitar(`/grupos/${grupoId}/horario`)).clases,
  avisos: (grupoId) => solicitar(`/grupos/${grupoId}/avisos`),
  detalleClase: (claseId) => solicitar(`/clases/${claseId}`),
  // Idempotente por token: si el alumno cambia de grupo, la API mueve el token al grupo nuevo.
  registrarDispositivo: (grupoId, token) =>
    solicitar('/dispositivos', {
      metodo: 'POST',
      cuerpo: { grupo_id: grupoId, token_push: token },
    }),
};
