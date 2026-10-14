import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { borrar, guardar, leer } from '@/servicios/almacenamiento';
import { cancelarTodosLosRecordatorios } from '@/servicios/recordatorios';

const GrupoContext = createContext(null);

// Provider: expone el grupo elegido a cualquier pantalla sin pasar props por cada nivel.
export const GrupoProvider = ({ children }) => {
  const [grupo, setGrupo] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    leer('grupo').then((guardado) => {
      setGrupo(guardado);
      setCargando(false);
    });
  }, []);

  const elegirGrupo = useCallback(async ({ id, cuatrimestre, letra, carrera }) => {
    const elegido = { id, cuatrimestre, letra, carrera };
    await guardar('grupo', elegido);
    setGrupo(elegido);
  }, []);

  const olvidarGrupo = useCallback(async () => {
    await cancelarTodosLosRecordatorios();
    await borrar('grupo');
    setGrupo(null);
  }, []);

  const valor = useMemo(
    () => ({ grupo, cargando, elegirGrupo, olvidarGrupo }),
    [grupo, cargando, elegirGrupo, olvidarGrupo],
  );
  return <GrupoContext.Provider value={valor}>{children}</GrupoContext.Provider>;
};

export const useGrupo = () => {
  const contexto = useContext(GrupoContext);
  if (!contexto) throw new Error('useGrupo debe usarse dentro de GrupoProvider');
  return contexto;
};
