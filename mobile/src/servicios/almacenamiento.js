import AsyncStorage from '@react-native-async-storage/async-storage';

// Caché local: si el almacenamiento falla, la app sigue funcionando sin ella.
export const leer = async (clave) => {
  try {
    const crudo = await AsyncStorage.getItem(`horarioutsc:${clave}`);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
};

export const guardar = async (clave, valor) => {
  try {
    await AsyncStorage.setItem(`horarioutsc:${clave}`, JSON.stringify(valor));
  } catch {
    // Sin caché no se pierde nada esencial.
  }
};

export const borrar = async (clave) => {
  try {
    await AsyncStorage.removeItem(`horarioutsc:${clave}`);
  } catch {
    // Igual que arriba.
  }
};
