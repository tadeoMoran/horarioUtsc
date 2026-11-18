import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boton } from '@/componentes/Boton';
import { EstadoPantalla } from '@/componentes/EstadoPantalla';
import { useGrupo } from '@/contexto/GrupoContext';
import { useGrupos } from '@/hooks/useGrupos';
import { useColores } from '@/tema/colores';
import { AREA_TACTIL, espacio, radio, tipografia } from '@/tema/tipografia';
import { agruparPorCarrera, etiquetaGrupo } from '@/utilidades/horario';

const textoGrupos = (cantidad) => (cantidad === 1 ? '1 grupo' : `${cantidad} grupos`);

export default function ElegirGrupo() {
  const c = useColores();
  const insets = useSafeAreaInsets();
  const { elegirGrupo } = useGrupo();
  const datos = useGrupos();
  // Paso 1: se elige la carrera. Paso 2: se elige el grupo de esa carrera.
  const [carreraId, setCarreraId] = useState(null);
  const [seleccionado, setSeleccionado] = useState(null);

  const carreras = useMemo(() => agruparPorCarrera(datos.grupos), [datos.grupos]);
  const carrera = carreras.find((item) => item.id === carreraId) ?? null;

  const elegirCarrera = (id) => {
    setCarreraId(id);
    setSeleccionado(null);
  };

  const cabecera = (
    <View style={estilos.cabecera}>
      <View style={[estilos.logo, { backgroundColor: c.texto }]}>
        <Ionicons name="calendar-outline" size={32} color={c.fondo} />
      </View>
      <Text style={[tipografia.titulo, { color: c.texto }]}>HorarioUTSC</Text>
      <Text style={[tipografia.cuerpo, { color: c.textoSecundario }]}>
        Tu horario, siempre contigo
      </Text>
      <Text style={[tipografia.subtitulo, estilos.pregunta, { color: c.texto }]}>
        {carrera ? '¿Qué grupo eres?' : '¿Qué carrera estudias?'}
      </Text>
      <Text style={[tipografia.detalle, { color: c.textoSecundario }]}>
        {carrera
          ? 'Elige tu cuatrimestre y letra.'
          : 'No necesitas cuenta. Te mostraremos el horario de tu grupo y te avisaremos cuando cambie.'}
      </Text>
    </View>
  );

  if (datos.fase !== 'listo') {
    return (
      <View style={[estilos.pantalla, { backgroundColor: c.fondo, paddingTop: insets.top }]}>
        {cabecera}
        {datos.fase === 'cargando' ? (
          <EstadoPantalla
            cargando
            titulo="Buscando los grupos"
            texto={
              datos.lento ? 'El servidor está despertando, puede tardar hasta un minuto.' : null
            }
          />
        ) : (
          <EstadoPantalla
            icono="cloud-offline-outline"
            titulo="No pudimos cargar los grupos"
            texto="Revisa tu conexión a internet e intenta de nuevo."
            accion={{ etiqueta: 'Reintentar', alPresionar: datos.recargar }}
          />
        )}
      </View>
    );
  }

  return (
    <View style={[estilos.pantalla, { backgroundColor: c.fondo, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={estilos.lista}>
        {cabecera}

        {carreras.length === 0 && (
          <EstadoPantalla
            icono="school-outline"
            titulo="Aún no hay grupos"
            texto="Cuando un administrador registre los grupos, aparecerán aquí."
          />
        )}

        {!carrera &&
          carreras.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => elegirCarrera(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`${item.nombre}, ${textoGrupos(item.grupos.length)}`}
              style={[estilos.fila, { backgroundColor: c.superficie, borderColor: c.borde }]}
            >
              <View style={estilos.textoFila}>
                <Text style={[tipografia.cuerpoFuerte, { color: c.texto }]}>{item.nombre}</Text>
                <Text style={[tipografia.detalle, { color: c.textoSecundario }]}>
                  {textoGrupos(item.grupos.length)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={c.textoSecundario} />
            </Pressable>
          ))}

        {carrera && (
          <>
            <Pressable
              onPress={() => elegirCarrera(null)}
              accessibilityRole="button"
              accessibilityLabel="Cambiar de carrera"
              style={[estilos.carreraElegida, { borderColor: c.borde }]}
            >
              <Ionicons name="chevron-back" size={20} color={c.acento} />
              <Text style={[tipografia.cuerpoFuerte, estilos.textoFila, { color: c.texto }]}>
                {carrera.nombre}
              </Text>
              <Text style={[tipografia.detalle, { color: c.acento }]}>Cambiar</Text>
            </Pressable>

            <View style={estilos.rejilla} accessibilityRole="radiogroup">
              {carrera.grupos.map((grupo) => {
                const activo = seleccionado?.id === grupo.id;
                return (
                  <Pressable
                    key={grupo.id}
                    onPress={() => setSeleccionado(grupo)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: activo }}
                    accessibilityLabel={`Grupo ${etiquetaGrupo(grupo)}`}
                    style={[
                      estilos.grupo,
                      {
                        backgroundColor: c.superficie,
                        borderColor: activo ? c.acento : c.borde,
                        borderWidth: activo ? 2 : StyleSheet.hairlineWidth,
                      },
                    ]}
                  >
                    <Text style={[tipografia.cuerpoFuerte, { color: c.texto }]}>
                      {etiquetaGrupo(grupo)}
                    </Text>
                    {activo && <Ionicons name="checkmark-circle" size={20} color={c.acento} />}
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {carrera && (
        <View
          style={[
            estilos.pie,
            {
              backgroundColor: c.fondo,
              borderTopColor: c.borde,
              paddingBottom: insets.bottom + espacio.m,
            },
          ]}
        >
          <Boton
            etiqueta="Ver mi horario"
            deshabilitado={!seleccionado}
            alPresionar={() => elegirGrupo(seleccionado)}
          />
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1 },
  lista: { paddingHorizontal: espacio.l, paddingBottom: espacio.xl },
  cabecera: {
    gap: espacio.xs,
    paddingTop: espacio.xl,
    paddingBottom: espacio.l,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radio.l,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espacio.s,
  },
  pregunta: { marginTop: espacio.xl },
  fila: {
    minHeight: AREA_TACTIL + 12,
    borderRadius: radio.m,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: espacio.l,
    paddingVertical: espacio.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.m,
    marginBottom: espacio.s,
  },
  textoFila: { flex: 1 },
  carreraElegida: {
    minHeight: AREA_TACTIL,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.s,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: espacio.l,
  },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  grupo: {
    minHeight: AREA_TACTIL + 4,
    minWidth: '30%',
    flexGrow: 1,
    borderRadius: radio.m,
    paddingHorizontal: espacio.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacio.xs,
  },
  pie: { padding: espacio.l, borderTopWidth: StyleSheet.hairlineWidth },
});
