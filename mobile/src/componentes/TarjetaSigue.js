import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColores } from '@/tema/colores';
import { espacio, radio, tipografia } from '@/tema/tipografia';
import { formatearDuracion } from '@/utilidades/tiempo';
import { FichaEstado } from './FichaEstado';
import { LineaTalon } from './LineaTalon';

const Campo = ({ etiqueta, valor }) => {
  const c = useColores();
  return (
    <View style={estilos.campo}>
      <Text style={[tipografia.etiqueta, { color: c.textoSecundario }]}>{etiqueta}</Text>
      <Text
        style={[tipografia.cifra, { color: c.carbon }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {valor}
      </Text>
    </View>
  );
};

const Cabecera = ({ izquierda, derecha }) => {
  const c = useColores();
  return (
    <View style={[estilos.cabecera, { backgroundColor: c.cabecera }]}>
      <Text style={[tipografia.etiqueta, { color: c.cabeceraTexto }]}>{izquierda}</Text>
      {derecha && <Text style={[tipografia.etiqueta, { color: c.cabeceraTexto }]}>{derecha}</Text>}
    </View>
  );
};

// Lo primero que se lee: qué clase sigue y dónde, como el cupón grande de una cartera de boletos.
export const TarjetaSigue = ({ situacion, alPresionar }) => {
  const c = useColores();
  const { fase, actual, siguiente, minutosParaSiguiente, minutosParaTerminar } = situacion;
  const marco = { backgroundColor: c.superficie, borderColor: c.borde };

  if (fase === 'sin_clases' || fase === 'terminado') {
    return (
      <View style={[estilos.cupon, marco]} accessibilityRole="summary">
        <Cabecera izquierda="HOY" />
        <View style={estilos.cuerpo}>
          <Text style={[tipografia.subtitulo, { color: c.texto }]}>
            {fase === 'terminado' ? 'Terminaste por hoy' : 'Hoy no tienes clases'}
          </Text>
          <Text style={[tipografia.detalle, { color: c.textoSecundario }]}>
            {fase === 'terminado'
              ? 'No quedan clases pendientes en tu horario de hoy.'
              : 'Elige otro día para ver su horario.'}
          </Text>
        </View>
      </View>
    );
  }

  // Si hay una que sigue, esa manda; si no, la que está en curso.
  const protagonista = siguiente ?? actual;
  const etiqueta = siguiente
    ? `Sigue en ${formatearDuracion(minutosParaSiguiente)}`
    : `En curso · termina en ${formatearDuracion(minutosParaTerminar)}`;

  return (
    <Pressable
      onPress={() => alPresionar?.(protagonista)}
      accessibilityRole="button"
      accessibilityLabel={`${etiqueta}. ${protagonista.materia}, ${protagonista.hora_inicio} a ${protagonista.hora_fin}, ${protagonista.aula}`}
      style={({ pressed }) => [estilos.cupon, marco, { opacity: pressed ? 0.9 : 1 }]}
    >
      <Cabecera
        izquierda={siguiente ? 'PRÓXIMA CLASE' : 'EN CURSO'}
        derecha={etiqueta.toUpperCase()}
      />
      <View style={estilos.cuerpo}>
        <View>
          <Text style={[tipografia.etiqueta, { color: c.textoSecundario }]}>MATERIA</Text>
          <Text style={[tipografia.titulo, { color: c.texto }]}>{protagonista.materia}</Text>
        </View>
        <View style={estilos.campos}>
          <Campo etiqueta="ENTRADA" valor={protagonista.hora_inicio} />
          <Campo etiqueta="AULA" valor={protagonista.aula} />
        </View>
      </View>
      <LineaTalon />
      <View style={estilos.talon}>
        <Text style={[tipografia.detalle, tipografia.numerica, { color: c.textoSecundario }]}>
          Termina a las {protagonista.hora_fin}
        </Text>
        {protagonista.estado === 'aula_cambiada' && <FichaEstado tipo="aula_cambiada" />}
        {siguiente && actual && (
          <Text style={[tipografia.detalle, { color: c.textoSecundario }]}>
            Ahora: {actual.materia} · termina en {formatearDuracion(minutosParaTerminar)}
          </Text>
        )}
      </View>
    </Pressable>
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
  },
  cuerpo: { padding: espacio.l, gap: espacio.m },
  campos: { flexDirection: 'row', gap: espacio.l },
  campo: { flex: 1 },
  talon: { padding: espacio.l, gap: espacio.s },
});
