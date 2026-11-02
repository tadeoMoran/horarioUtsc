import { StyleSheet, Text, View } from 'react-native';
import { useColores } from '@/tema/colores';
import { radio, tipografia } from '@/tema/tipografia';

// El estado siempre se comunica con texto; el color solo lo refuerza.
const TEXTOS = {
  en_curso: 'En curso',
  aula_cambiada: 'Aula cambió',
  cancelada: 'Cancelada',
};

// «En curso» es blanco con borde azul marino para leerse igual sobre la cabecera azul
// del cupón y sobre el fondo de la pantalla.
const MARINO = '#0B2A5B';

export const FichaEstado = ({ tipo }) => {
  const c = useColores();
  const estilos = {
    en_curso: { fondo: '#FFFFFF', texto: MARINO, borde: MARINO },
    aula_cambiada: { fondo: c.fichaCambio, texto: c.fichaCambioTexto, borde: c.fichaCambio },
    cancelada: { fondo: c.fichaCancelada, texto: c.fichaCanceladaTexto, borde: c.fichaCancelada },
  }[tipo];
  if (!estilos) return null;

  return (
    <View style={[base.ficha, { backgroundColor: estilos.fondo, borderColor: estilos.borde }]}>
      <Text style={[tipografia.etiqueta, base.texto, { color: estilos.texto }]}>
        {TEXTOS[tipo].toUpperCase()}
      </Text>
    </View>
  );
};

const base = StyleSheet.create({
  ficha: {
    borderRadius: radio.s,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  texto: { fontSize: 11, letterSpacing: 1 },
});
