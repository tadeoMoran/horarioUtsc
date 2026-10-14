import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

// Hora actual, refrescada cada 30 s y al volver a la app, para que «Sigue en N min» no se quede viejo.
export const useAhora = (intervaloMs = 30_000) => {
  const [ahora, setAhora] = useState(() => new Date());

  useEffect(() => {
    const temporizador = setInterval(() => setAhora(new Date()), intervaloMs);
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') setAhora(new Date());
    });
    return () => {
      clearInterval(temporizador);
      suscripcion.remove();
    };
  }, [intervaloMs]);

  return ahora;
};
