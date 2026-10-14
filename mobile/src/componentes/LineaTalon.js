import { StyleSheet, View } from 'react-native';
import { useColores } from '@/tema/colores';

// Línea punteada que separa el cupón de su talón. El contenedor recorta la mitad inferior de un
// borde punteado completo: así se ve igual en iOS y Android (el borde punteado de un solo lado no).
export const LineaTalon = () => {
  const c = useColores();
  return (
    <View style={estilos.recorte} accessibilityElementsHidden importantForAccessibility="no">
      <View style={[estilos.linea, { borderColor: c.borde }]} />
    </View>
  );
};

const estilos = StyleSheet.create({
  recorte: { height: 2, overflow: 'hidden', marginHorizontal: 12 },
  linea: { height: 4, borderWidth: 2, borderStyle: 'dashed' },
});
