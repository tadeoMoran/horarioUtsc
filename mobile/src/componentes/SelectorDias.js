import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColores } from '@/tema/colores';
import { AREA_TACTIL, radio, tipografia } from '@/tema/tipografia';
import { DIAS, DIAS_CORTOS } from '@/utilidades/tiempo';

export const SelectorDias = ({ fechas, seleccionado, hoy, alCambiar }) => {
  const c = useColores();

  return (
    <View style={estilos.fila} accessibilityRole="tablist">
      {fechas.map(({ dia, fecha }) => {
        const activo = dia === seleccionado;
        return (
          <Pressable
            key={dia}
            onPress={() => alCambiar(dia)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activo }}
            accessibilityLabel={`${DIAS[dia]} ${fecha.getDate()}${dia === hoy ? ', hoy' : ''}`}
            style={[
              estilos.ficha,
              { backgroundColor: activo ? c.texto : c.superficie, borderColor: c.borde },
            ]}
          >
            <Text style={[tipografia.pie, { color: activo ? c.fondo : c.textoSecundario }]}>
              {DIAS_CORTOS[dia]}
            </Text>
            <Text
              style={[
                tipografia.cuerpoFuerte,
                tipografia.numerica,
                { color: activo ? c.fondo : c.texto },
              ]}
            >
              {fecha.getDate()}
            </Text>
            {dia === hoy && (
              <View style={[estilos.punto, { backgroundColor: activo ? c.fondo : c.acento }]} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', gap: 6 },
  ficha: {
    flex: 1,
    minHeight: AREA_TACTIL + 8,
    borderRadius: radio.m,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  punto: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
});
