import { useCallback, useEffect } from 'react';
import { horariosService } from '@/servicios/horariosService';
import { sincronizarRecordatorios } from '@/servicios/recordatorios';
import { useRecursoConCache } from './useRecursoConCache';

export const useHorario = (grupoId) => {
  const cargar = useCallback(() => horariosService.horario(grupoId), [grupoId]);
  const recurso = useRecursoConCache(`horario:${grupoId}`, cargar);

  // Si el administrador mueve o cancela una clase, sus recordatorios se ajustan solos.
  useEffect(() => {
    if (recurso.datos) sincronizarRecordatorios(recurso.datos).catch(() => {});
  }, [recurso.datos]);

  return { ...recurso, clases: recurso.datos ?? [] };
};
