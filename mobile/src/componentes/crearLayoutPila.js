import { Stack } from 'expo-router';
import { useColores } from '@/tema/colores';

// Cada pestaña tiene su propia pila: así iOS muestra el título grande que se colapsa al desplazar.
export const crearLayoutPila = (titulo) =>
  function LayoutPila() {
    const c = useColores();
    return (
      <Stack
        screenOptions={{
          headerLargeTitle: true,
          headerLargeTitleShadowVisible: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: c.fondo },
          headerLargeStyle: { backgroundColor: c.fondo },
          headerTintColor: c.texto,
          headerTitleStyle: { color: c.texto },
          contentStyle: { backgroundColor: c.fondo },
        }}
      >
        <Stack.Screen name="index" options={{ title: titulo }} />
      </Stack>
    );
  };
