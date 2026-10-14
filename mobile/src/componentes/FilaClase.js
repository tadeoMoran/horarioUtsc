import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colorDeMateria, useColores } from '@/tema/colores';
import { radio, espacio, tipografia } from '@/tema/tipografia';
import { Sello } from './Cupon';
import { FichaEstado } from './FichaEstado';

const tipoDeFicha = (clase, enCurso) => {
  if (clase.estado === 'aula_cambiada') return 'aula_cambiada';
  return enCurso ? 'en_curso' : null;
};

// Una clase del día: talón con cabecera azul. Las canceladas llevan el sello rojo y no se borran.
export const FilaClase = ({ clase, enCurso = false, alPresionar }) => {
  const c = useColores();
  const cancelada = clase.estado === 'cancelada';
  const ficha = tipoDeFicha(clase, enCurso);

  return (
    <Pressable
      onPress={() => alPresionar?.(clase)}
      accessibilityRole="button"
      accessibilityLabel={`${clase.materia}, ${clase.hora_inicio} a ${clase.hora_fin}, ${clase.aula}${
        cancelada ? ', cancelada' : ''
      }${clase.estado === 'aula_cambiada' ? ', aula cambiada' : ''}${enCurso ? ', en curso' : ''}`}
      style={({ pressed }) => [
        estilos.fila,
        { backgroundColor: c.superficie, borderColor: c.borde, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={[estilos.cabecera, { backgroundColor: c.cabecera }]}>
        <View style={estilos.horario}>
          <View style={[estilos.punto, { backgroundColor: colorDeMateria(clase.materia) }]} />
          <Text style={[tipografia.etiqueta, tipografia.numerica, { color: c.cabeceraTexto }]}>
            {clase.hora_inicio} – {clase.hora_fin}
          </Text>
        </View>
        {ficha && <FichaEstado tipo={ficha} />}
      </View>
      <View style={estilos.cuerpo}>
        <View style={estilos.materia}>
          <Text style={[tipografia.cuerpoFuerte, { color: c.texto }, cancelada && estilos.tachada]}>
            {clase.materia}
          </Text>
          {clase.docente && (
            <Text style={[tipografia.detalle, { color: c.textoSecundario }]}>{clase.docente}</Text>
          )}
        </View>
        {cancelada ? (
          <Sello texto="CANCELADA" />
        ) : (
          <View style={estilos.aula}>
            <Text style={[tipografia.etiqueta, { color: c.textoSecundario }]}>AULA</Text>
            <Text
              style={[tipografia.subtitulo, tipografia.numerica, { color: c.carbon }]}
              numberOfLines={1}
            >
              {clase.aula}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

const estilos = StyleSheet.create({
  fila: { borderRadius: radio.s, borderWidth: 1, overflow: 'hidden' },
  cabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: espacio.m,
    paddingVertical: espacio.xs + 2,
    minHeight: 32,
  },
  horario: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  punto: { width: 8, height: 8, borderRadius: 4 },
  cuerpo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.m,
    padding: espacio.m,
    minHeight: 56,
  },
  materia: { flex: 1, gap: 2 },
  aula: { alignItems: 'flex-end', maxWidth: 110 },
  tachada: { textDecorationLine: 'line-through' },
});
