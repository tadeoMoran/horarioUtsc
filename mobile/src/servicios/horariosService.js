import { solicitar } from './clienteApi';

// Capa de servicio (Repository): concentra las llamadas a la API.
export const horariosService = {
  grupos: () => solicitar('/grupos'),
  horario: async (grupoId) => (await solicitar(`/grupos/${grupoId}/horario`)).clases,
  avisos: (grupoId) => solicitar(`/grupos/${grupoId}/avisos`),
  detalleClase: (claseId) => solicitar(`/clases/${claseId}`),
};
