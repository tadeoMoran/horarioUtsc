import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { guardar, leer } from '@/servicios/almacenamiento';

const SEGUNDOS_PARA_AVISAR_LENTITUD = 5;

const INICIAL = {
  datos: null,
  actualizadoEn: null,
  fase: 'cargando', // cargando | listo | error
  sinConexion: false,
  mensaje: null,
  lento: false,
};

// Muestra primero lo guardado en el dispositivo y luego intenta refrescar desde la API.
// Si la red falla y hay caché, se queda con la caché y marca `sinConexion`.
export const useRecursoConCache = (clave, cargar) => {
  const [estado, setEstado] = useState(INICIAL);
  const [refrescando, setRefrescando] = useState(false);
  const vigente = useRef(true);
  const claveActual = useRef(clave);
  claveActual.current = clave;

  const refrescar = useCallback(async () => {
    const claveSolicitada = clave;
    try {
      const datos = await cargar();
      const marca = Date.now();
      await guardar(claveSolicitada, { datos, guardadoEn: marca });
      if (!vigente.current || claveActual.current !== claveSolicitada) return;
      setEstado({ ...INICIAL, datos, actualizadoEn: marca, fase: 'listo' });
    } catch (error) {
      if (!vigente.current || claveActual.current !== claveSolicitada) return;
      setEstado((previo) =>
        previo.datos
          ? { ...previo, fase: 'listo', sinConexion: true, lento: false }
          : {
              ...previo,
              fase: 'error',
              lento: false,
              sinConexion: error.sinConexion ?? true,
              mensaje: error.message,
            },
      );
    }
  }, [clave, cargar]);

  useEffect(() => {
    vigente.current = true;
    setEstado(INICIAL);
    let cancelado = false;

    leer(clave).then((guardado) => {
      if (cancelado || !guardado) return;
      setEstado((previo) =>
        previo.datos
          ? previo
          : { ...previo, datos: guardado.datos, actualizadoEn: guardado.guardadoEn, fase: 'listo' },
      );
    });
    refrescar();

    const aviso = setTimeout(() => {
      setEstado((previo) => (previo.fase === 'cargando' ? { ...previo, lento: true } : previo));
    }, SEGUNDOS_PARA_AVISAR_LENTITUD * 1000);

    const suscripcion = AppState.addEventListener('change', (siguiente) => {
      if (siguiente === 'active') refrescar();
    });

    return () => {
      cancelado = true;
      vigente.current = false;
      clearTimeout(aviso);
      suscripcion.remove();
    };
  }, [clave, refrescar]);

  const recargarManual = useCallback(async () => {
    setRefrescando(true);
    await refrescar();
    setRefrescando(false);
  }, [refrescar]);

  return { ...estado, refrescando, recargar: recargarManual };
};
