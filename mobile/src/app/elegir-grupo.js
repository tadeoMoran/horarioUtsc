import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boton } from '@/componentes/Boton';
import { EstadoPantalla } from '@/componentes/EstadoPantalla';
import { useGrupo } from '@/contexto/GrupoContext';
import { useGrupos } from '@/hooks/useGrupos';
import { useColores } from '@/tema/colores';
import { AREA_TACTIL, espacio, radio, tipografia } from '@/tema/tipografia';
import { etiquetaGrupo } from '@/utilidades/horario';

export default function ElegirGrupo() {
  const c = useColores();
  const insets = useSafeAreaInsets();
  const { elegirGrupo } = useGrupo();
  const datos = useGrupos();
  const [seleccionado, setSeleccionado] = useState(null);

  const secciones = useMemo(() => {
    const porCarrera = new Map();
    for (const grupo of datos.grupos) {
      if (!porCarrera.has(grupo.carrera)) porCarrera.set(grupo.carrera, []);
      porCarrera.get(grupo.carrera).push(grupo);
    }
    return [...porCarrera].map(([title, data]) => ({ title, data }));
  }, [datos.grupos]);

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
        ¿De qué grupo eres?
      </Text>
      <Text style={[tipografia.detalle, { color: c.textoSecundario }]}>
        No necesitas cuenta. Te mostraremos el horario de tu grupo y te avisaremos cuando cambie.
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
      <SectionList
        sections={secciones}
        keyExtractor={(grupo) => String(grupo.id)}
        contentContainerStyle={estilos.lista}
        ListHeaderComponent={cabecera}
        ListEmptyComponent={
          <EstadoPantalla
            icono="school-outline"
            titulo="Aún no hay grupos"
            texto="Cuando un administrador registre los grupos, aparecerán aquí."
          />
        }
        renderSectionHeader={({ section }) => (
          <Text style={[tipografia.etiqueta, estilos.carrera, { color: c.textoSecundario }]}>
            {section.title.toUpperCase()}
          </Text>
        )}
        renderItem={({ item }) => {
          const activo = seleccionado?.id === item.id;
          return (
            <Pressable
              onPress={() => setSeleccionado(item)}
              accessibilityRole="radio"
              accessibilityState={{ selected: activo }}
              accessibilityLabel={`Grupo ${etiquetaGrupo(item)}`}
              style={[
                estilos.opcion,
                {
                  backgroundColor: c.superficie,
                  borderColor: activo ? c.acento : c.borde,
                  borderWidth: activo ? 2 : StyleSheet.hairlineWidth,
                },
              ]}
            >
              <Text style={[tipografia.cuerpoFuerte, { color: c.texto }]}>
                {etiquetaGrupo(item)}
              </Text>
              {activo && <Ionicons name="checkmark-circle" size={24} color={c.acento} />}
            </Pressable>
          );
        }}
      />
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
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1 },
  lista: { paddingHorizontal: espacio.l, paddingBottom: espacio.xl },
  cabecera: {
    gap: espacio.xs,
    paddingTop: espacio.xl,
    paddingBottom: espacio.m,
    paddingHorizontal: espacio.l,
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
  carrera: { marginTop: espacio.l, marginBottom: espacio.s },
  opcion: {
    minHeight: AREA_TACTIL + 4,
    borderRadius: radio.m,
    paddingHorizontal: espacio.l,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: espacio.s,
  },
  pie: { padding: espacio.l, borderTopWidth: StyleSheet.hairlineWidth },
});
