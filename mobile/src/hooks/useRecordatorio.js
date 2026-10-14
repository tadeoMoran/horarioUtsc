import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking } from 'react-native';
import {
  activarRecordatorio,
  desactivarRecordatorio,
  hayRecordatorio,
  NO_DISPONIBLE,
} from '@/servicios/recordatorios';

// Estado del recordatorio «15 min antes» de una clase.
export const useRecordatorio = (clase) => {
  const [activo, setActivo] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (clase) hayRecordatorio(clase.id).then(setActivo);
  }, [clase]);

  const alternar = useCallback(async () => {
    if (!clase || ocupado) return;
    setOcupado(true);
    try {
      if (activo) {
        await desactivarRecordatorio(clase.id);
        setActivo(false);
      } else if (await activarRecordatorio(clase)) {
        setActivo(true);
      } else {
        Alert.alert(
          'Permiso de notificaciones',
          'Para avisarte antes de la clase necesitamos permiso para enviar notificaciones. Puedes activarlo en los ajustes del teléfono.',
          [
            { text: 'Ahora no', style: 'cancel' },
            { text: 'Abrir ajustes', onPress: () => Linking.openSettings() },
          ],
        );
      }
    } catch (error) {
      console.warn('[recordatorio]', error);
      if (error.message === NO_DISPONIBLE) {
        Alert.alert(
          'Recordatorios no disponibles',
          'Esta versión de Expo Go no incluye las notificaciones. Actualiza Expo Go desde la tienda o usa una build de desarrollo.',
        );
      } else {
        Alert.alert('No se pudo programar', 'Intenta de nuevo en un momento.');
      }
    } finally {
      setOcupado(false);
    }
  }, [clase, activo, ocupado]);

  return { activo, ocupado, alternar };
};
