import { horariosService } from '@/servicios/horariosService';
import { useRecursoConCache } from './useRecursoConCache';

// Lista de grupos disponibles para elegir (se guarda en caché por si falla la red).
export const useGrupos = () => {
  const recurso = useRecursoConCache('grupos', horariosService.grupos);
  return { ...recurso, grupos: recurso.datos ?? [] };
};
