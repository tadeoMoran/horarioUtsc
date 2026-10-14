import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BannerSinConexion } from '@/componentes/BannerSinConexion';
import { EstadoPantalla } from '@/componentes/EstadoPantalla';
import { FilaClase } from '@/componentes/FilaClase';
import { SelectorDias } from '@/componentes/SelectorDias';
import { TarjetaSigue } from '@/componentes/TarjetaSigue';
import { useGrupo } from '@/contexto/GrupoContext';
import { useAhora } from '@/hooks/useAhora';
import { useHorario } from '@/hooks/useHorario';
import { useColores } from '@/tema/colores';
import { espacio, tipografia } from '@/tema/tipografia';
import { clasesDelDia, etiquetaGrupo, idsEnCurso, situacionDelDia } from '@/utilidades/horario';
import {
  DIAS,
  diaSemanaDe,
  fechasDeLaSemana,
  formatearActualizacion,
  formatearFechaLarga,
  minutosDe,
} from '@/utilidades/tiempo';

export default function Inicio() {
  const c = useColores();
  const router = useRouter();
  const { grupo } = useGrupo();
  const ahora = useAhora();
  const horario = useHorario(grupo.id);

  const hoy = diaSemanaDe(ahora);
  const [diaElegido, setDiaElegido] = useState(null);
  // Los domingos no hay clases: se muestra el lunes.
  const dia = diaElegido ?? (hoy === 7 ? 1 : hoy);
  const esHoy = dia === hoy;

  const fechas = useMemo(() => fechasDeLaSemana(ahora), [ahora]);
  const clasesDia = useMemo(() => clasesDelDia(horario.clases, dia), [horario.clases, dia]);
  const ahoraMin = minutosDe(ahora);
  const situacion = useMemo(() => situacionDelDia(clasesDia, ahoraMin), [clasesDia, ahoraMin]);
  const enCurso = useMemo(() => idsEnCurso(clasesDia, ahoraMin), [clasesDia, ahoraMin]);

  const abrirClase = (clase) =>
    router.push({ pathname: '/clase/[id]', params: { id: String(clase.id) } });

  const titulo = <Stack.Screen options={{ title: `Horario de ${etiquetaGrupo(grupo)}` }} />;

  if (horario.fase === 'cargando') {
    return (
      <>
        {titulo}
        <EstadoPantalla
          cargando
          titulo="Cargando tu horario"
          texto={
            horario.lento
              ? 'El servidor está despertando, puede tardar hasta un minuto.'
              : 'Un momento…'
          }
        />
      </>
    );
  }

  if (horario.fase === 'error') {
    return (
      <>
        {titulo}
        <EstadoPantalla
          icono="cloud-offline-outline"
          titulo="No pudimos cargar tu horario"
          texto={
            horario.sinConexion
              ? 'Revisa tu conexión a internet e intenta de nuevo.'
              : horario.mensaje
          }
          accion={{ etiqueta: 'Reintentar', alPresionar: horario.recargar }}
        />
      </>
    );
  }

  return (
    <>
      {titulo}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={estilos.contenido}
        refreshControl={
          <RefreshControl
            refreshing={horario.refrescando}
            onRefresh={horario.recargar}
            tintColor={c.acento}
          />
        }
      >
        {horario.sinConexion && <BannerSinConexion />}

        <View>
          <Text style={[tipografia.detalle, { color: c.textoSecundario }]}>
            {formatearFechaLarga(ahora)}
          </Text>
          {horario.actualizadoEn && (
            <Text style={[tipografia.pie, { color: c.textoSecundario }]}>
              Actualizado {formatearActualizacion(horario.actualizadoEn, ahora)}
            </Text>
          )}
        </View>

        <SelectorDias fechas={fechas} seleccionado={dia} hoy={hoy} alCambiar={setDiaElegido} />

        {esHoy ? (
          <TarjetaSigue situacion={situacion} alPresionar={abrirClase} />
        ) : (
          clasesDia.length === 0 && (
            <Text style={[tipografia.cuerpo, { color: c.textoSecundario }]}>
              El {DIAS[dia].toLowerCase()} no hay clases registradas.
            </Text>
          )
        )}

        {clasesDia.length > 0 && (
          <View style={estilos.lista}>
            <Text style={[tipografia.subtitulo, { color: c.texto }]}>
              {esHoy ? 'Clases de hoy' : `Clases del ${DIAS[dia].toLowerCase()}`}
            </Text>
            {clasesDia.map((clase) => (
              <FilaClase
                key={clase.id}
                clase={clase}
                enCurso={esHoy && enCurso.has(clase.id)}
                alPresionar={abrirClase}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: espacio.l, gap: espacio.l },
  lista: { gap: espacio.m },
});
