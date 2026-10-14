import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useColores } from '@/tema/colores';
import { espacio, radio, tipografia } from '@/tema/tipografia';

export const BannerSinConexion = () => {
  const c = useColores();
  return (
    <View
      accessibilityRole="alert"
      style={[estilos.banner, { backgroundColor: c.superficie, borderColor: c.borde }]}
    >
      <Ionicons name="cloud-offline-outline" size={20} color={c.texto} />
      <Text style={[tipografia.detalle, estilos.texto, { color: c.texto }]}>
        Sin conexión · mostrando tu último horario guardado
      </Text>
    </View>
  );
};

const estilos = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.m,
    borderWidth: StyleSheet.hairlineWidth,
  },
  texto: { flex: 1 },
});
