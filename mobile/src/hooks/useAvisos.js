import { useCallback, useEffect, useMemo, useState } from 'react';
import { guardar, leer } from '@/servicios/almacenamiento';
import { horariosService } from '@/servicios/horariosService';
import { useRecursoConCache } from './useRecursoConCache';

const MAXIMO_LEIDOS = 200;

export const useAvisos = (grupoId) => {
  const cargar = useCallback(() => horariosService.avisos(grupoId), [grupoId]);
  const recurso = useRecursoConCache(`avisos:${grupoId}`, cargar);
  const [leidos, setLeidos] = useState([]);

  useEffect(() => {
    leer(`leidos:${grupoId}`).then((guardados) => setLeidos(guardados ?? []));
  }, [grupoId]);

  const avisos = useMemo(() => recurso.datos ?? [], [recurso.datos]);
  const noLeidos = useMemo(
    () => new Set(avisos.filter((a) => !leidos.includes(a.id)).map((a) => a.id)),
    [avisos, leidos],
  );

  const marcarLeidos = useCallback(() => {
    const todos = [...new Set([...leidos, ...avisos.map((a) => a.id)])].slice(-MAXIMO_LEIDOS);
    setLeidos(todos);
    guardar(`leidos:${grupoId}`, todos);
  }, [avisos, grupoId, leidos]);

  return { ...recurso, avisos, noLeidos, marcarLeidos };
};
