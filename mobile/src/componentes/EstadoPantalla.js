import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useColores } from '@/tema/colores';
import { espacio, tipografia } from '@/tema/tipografia';
import { Boton } from './Boton';

// Cargando, vacío y error comparten la misma estructura: icono o indicador, qué pasa y qué hacer.
export const EstadoPantalla = ({ cargando = false, icono, titulo, texto, accion }) => {
  const c = useColores();
  return (
    <View style={estilos.contenedor} accessibilityRole={cargando ? 'progressbar' : undefined}>
      {cargando ? (
        <ActivityIndicator size="large" color={c.acento} />
      ) : (
        icono && <Ionicons name={icono} size={40} color={c.textoSecundario} />
      )}
      <Text style={[tipografia.subtitulo, estilos.centrado, { color: c.texto }]}>{titulo}</Text>
      {texto && (
        <Text style={[tipografia.cuerpo, estilos.centrado, { color: c.textoSecundario }]}>
          {texto}
        </Text>
      )}
      {accion && <Boton etiqueta={accion.etiqueta} alPresionar={accion.alPresionar} />}
    </View>
  );
};

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacio.m,
    padding: espacio.xl,
  },
  centrado: { textAlign: 'center' },
});
