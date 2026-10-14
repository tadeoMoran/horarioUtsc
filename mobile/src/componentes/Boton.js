import { Pressable, StyleSheet, Text } from 'react-native';
import { useColores } from '@/tema/colores';
import { AREA_TACTIL, radio, tipografia } from '@/tema/tipografia';

export const Boton = ({ etiqueta, alPresionar, variante = 'primario', deshabilitado = false }) => {
  const c = useColores();
  const primario = variante === 'primario';

  return (
    <Pressable
      onPress={alPresionar}
      disabled={deshabilitado}
      accessibilityRole="button"
      accessibilityState={{ disabled: deshabilitado }}
      style={({ pressed }) => [
        estilos.boton,
        primario
          ? { backgroundColor: c.texto }
          : { backgroundColor: 'transparent', borderColor: c.texto, borderWidth: 1 },
        { opacity: deshabilitado ? 0.4 : pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={[tipografia.cuerpoFuerte, { color: primario ? c.fondo : c.texto }]}>
        {etiqueta}
      </Text>
    </Pressable>
  );
};

const estilos = StyleSheet.create({
  boton: {
    minHeight: AREA_TACTIL,
    borderRadius: radio.m,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
});
