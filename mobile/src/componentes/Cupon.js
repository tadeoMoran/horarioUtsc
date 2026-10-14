import { StyleSheet, Text, View } from 'react-native';
import { useColores } from '@/tema/colores';
import { espacio, radio, tipografia } from '@/tema/tipografia';

// Cupón de la cartera de boletos: cabecera azul con rótulos en mayúsculas y cuerpo de papel.
export const Cupon = ({ izquierda, derecha, children }) => {
  const c = useColores();
  return (
    <View style={[estilos.cupon, { backgroundColor: c.superficie, borderColor: c.borde }]}>
      <View style={[estilos.cabecera, { backgroundColor: c.cabecera }]}>
        <Text style={[tipografia.etiqueta, estilos.izquierda, { color: c.cabeceraTexto }]}>
          {izquierda}
        </Text>
        {derecha}
      </View>
      {children}
    </View>
  );
};

// Campo de formulario impreso: rótulo pequeño y valor «llenado a carbón».
export const CampoCupon = ({ etiqueta, valor, secundario, grande = false }) => {
  const c = useColores();
  return (
    <View
      style={estilos.campo}
      accessible
      accessibilityLabel={`${etiqueta}: ${valor}${secundario ? `, ${secundario}` : ''}`}
    >
      <Text style={[tipografia.etiqueta, { color: c.textoSecundario }]}>{etiqueta}</Text>
      <Text
        style={[grande ? tipografia.cifra : tipografia.subtitulo, { color: c.carbon }]}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {valor}
      </Text>
      {secundario && (
        <Text style={[tipografia.pie, { color: c.textoSecundario }]}>{secundario}</Text>
      )}
    </View>
  );
};

// Sello rojo girado para lo cancelado. Va dentro del flujo para que nunca quede tapado.
export const Sello = ({ texto }) => {
  const c = useColores();
  return (
    <View style={[estilos.sello, { borderColor: c.fichaCancelada }]}>
      <Text style={[tipografia.etiqueta, estilos.textoSello, { color: c.fichaCancelada }]}>
        {texto}
      </Text>
    </View>
  );
};

const estilos = StyleSheet.create({
  cupon: { borderRadius: radio.s, borderWidth: 1, overflow: 'hidden' },
  cabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: espacio.s,
    paddingHorizontal: espacio.l,
    paddingVertical: espacio.s,
    minHeight: 36,
  },
  izquierda: { flexShrink: 1 },
  campo: { flex: 1, gap: 2 },
  sello: {
    alignSelf: 'flex-start',
    borderWidth: 3,
    borderRadius: radio.s,
    paddingHorizontal: 10,
    paddingVertical: 4,
    transform: [{ rotate: '-8deg' }],
  },
  textoSello: { fontSize: 16, letterSpacing: 2 },
});
