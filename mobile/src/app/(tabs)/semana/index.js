import { Stack, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { BannerSinConexion } from '@/componentes/BannerSinConexion';
import { EstadoPantalla } from '@/componentes/EstadoPantalla';
import { FilaClase } from '@/componentes/FilaClase';
import { useGrupo } from '@/contexto/GrupoContext';
import { useAhora } from '@/hooks/useAhora';
import { useHorario } from '@/hooks/useHorario';
import { useColores } from '@/tema/colores';
import { espacio, tipografia } from '@/tema/tipografia';
import { agruparPorDia, etiquetaGrupo, idsEnCurso } from '@/utilidades/horario';
import { DIAS, diaSemanaDe, minutosDe } from '@/utilidades/tiempo';

export default function Semana() {
  const c = useColores();
  const router = useRouter();
  const { grupo } = useGrupo();
  const ahora = useAhora();
  const horario = useHorario(grupo.id);

  const hoy = diaSemanaDe(ahora);
  const secciones = useMemo(
    () => agruparPorDia(horario.clases).map(({ dia, clases }) => ({ dia, data: clases })),
    [horario.clases],
  );
  const enCursoHoy = useMemo(
    () =>
      idsEnCurso(
        horario.clases.filter((clase) => clase.dia_semana === hoy),
        minutosDe(ahora),
      ),
    [horario.clases, hoy, ahora],
  );

  const titulo = <Stack.Screen options={{ title: `Semana de ${etiquetaGrupo(grupo)}` }} />;

  if (horario.fase === 'cargando') {
    return (
      <>
        {titulo}
        <EstadoPantalla cargando titulo="Cargando la semana" />
      </>
    );
  }

  if (horario.fase === 'error') {
    return (
      <>
        {titulo}
        <EstadoPantalla
          icono="cloud-offline-outline"
          titulo="No pudimos cargar la semana"
          texto="Revisa tu conexión a internet e intenta de nuevo."
          accion={{ etiqueta: 'Reintentar', alPresionar: horario.recargar }}
        />
      </>
    );
  }

  return (
    <>
      {titulo}
      <SectionList
        sections={secciones}
        keyExtractor={(clase) => String(clase.id)}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={estilos.contenido}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={horario.refrescando}
            onRefresh={horario.recargar}
            tintColor={c.acento}
          />
        }
        ListHeaderComponent={horario.sinConexion ? <BannerSinConexion /> : null}
        ListEmptyComponent={
          <EstadoPantalla
            icono="calendar-outline"
            titulo="Aún no hay clases"
            texto="Tu administrador todavía no ha capturado el horario de este grupo."
          />
        }
        renderSectionHeader={({ section }) => (
          <View style={estilos.encabezadoDia}>
            <Text style={[tipografia.subtitulo, { color: c.texto }]}>
              {DIAS[section.dia]}
              {section.dia === hoy ? ' · hoy' : ''}
            </Text>
          </View>
        )}
        renderItem={({ item, section }) => (
          <View style={estilos.fila}>
            <FilaClase
              clase={item}
              enCurso={section.dia === hoy && enCursoHoy.has(item.id)}
              alPresionar={(clase) =>
                router.push({ pathname: '/clase/[id]', params: { id: String(clase.id) } })
              }
            />
          </View>
        )}
      />
    </>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: espacio.l },
  encabezadoDia: { marginTop: espacio.l, marginBottom: espacio.s },
  fila: { marginBottom: espacio.s },
});
