import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GrupoProvider, useGrupo } from '@/contexto/GrupoContext';
import { configurarNotificaciones } from '@/servicios/recordatorios';
import { useColores } from '@/tema/colores';

configurarNotificaciones();

const Navegacion = () => {
  const { grupo, cargando } = useGrupo();
  const c = useColores();
  if (cargando) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.fondo } }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={Boolean(grupo)}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="clase/[id]"
          options={{
            headerShown: true,
            title: 'Clase',
            headerBackTitle: 'Atrás',
            headerShadowVisible: false,
            headerStyle: { backgroundColor: c.fondo },
            headerTintColor: c.texto,
            headerTitleStyle: { color: c.texto },
          }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!grupo}>
        <Stack.Screen name="elegir-grupo" />
      </Stack.Protected>
    </Stack>
  );
};

export default function RaizLayout() {
  return (
    <GrupoProvider>
      <StatusBar style="auto" />
      <Navegacion />
    </GrupoProvider>
  );
}
