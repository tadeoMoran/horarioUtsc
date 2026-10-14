import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { BannerSinConexion } from '@/componentes/BannerSinConexion';
import { Cupon } from '@/componentes/Cupon';
import { EstadoPantalla } from '@/componentes/EstadoPantalla';
import { useGrupo } from '@/contexto/GrupoContext';
import { useAhora } from '@/hooks/useAhora';
import { useAvisos } from '@/hooks/useAvisos';
import { useColores } from '@/tema/colores';
import { espacio, tipografia } from '@/tema/tipografia';
import { formatearAntiguedad } from '@/utilidades/tiempo';

const TIPOS = {
  cambio_aula: { texto: 'Cambio de aula' },
  clase_cancelada: { texto: 'Clase cancelada' },
  general: { texto: 'Aviso general' },
};

export default function Avisos() {
  const c = useColores();
  const { grupo } = useGrupo();
  const ahora = useAhora(60_000);
  const datos = useAvisos(grupo.id);

  // Los puntos de «no leído» se quitan al salir de la pantalla, no mientras se leen.
  const marcar = useRef(datos.marcarLeidos);
  marcar.current = datos.marcarLeidos;
  useFocusEffect(useCallback(() => () => marcar.current(), []));

  const titulo = <Stack.Screen options={{ title: 'Avisos' }} />;

  if (datos.fase === 'cargando') {
    return (
      <>
        {titulo}
        <EstadoPantalla cargando titulo="Cargando avisos" />
      </>
    );
  }

  if (datos.fase === 'error') {
    return (
      <>
        {titulo}
        <EstadoPantalla
          icono="cloud-offline-outline"
          titulo="No pudimos cargar los avisos"
          texto="Revisa tu conexión a internet e intenta de nuevo."
          accion={{ etiqueta: 'Reintentar', alPresionar: datos.recargar }}
        />
      </>
    );
  }

  return (
    <>
      {titulo}
      <FlatList
        data={datos.avisos}
        keyExtractor={(aviso) => String(aviso.id)}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={estilos.contenido}
        refreshControl={
          <RefreshControl
            refreshing={datos.refrescando}
            onRefresh={datos.recargar}
            tintColor={c.acento}
          />
        }
        ListHeaderComponent={
          <View style={estilos.cabecera}>
            {datos.sinConexion && <BannerSinConexion />}
            <Text style={[tipografia.detalle, { color: c.textoSecundario }]}>
              Publicados por el administrador de tu grupo. No son avisos oficiales de la escuela.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EstadoPantalla
            icono="notifications-off-outline"
            titulo="Sin avisos por ahora"
            texto="Cuando una clase cambie de aula o se cancele, lo verás aquí."
          />
        }
        ItemSeparatorComponent={() => <View style={estilos.separador} />}
        renderItem={({ item }) => {
          const tipo = TIPOS[item.tipo] ?? TIPOS.general;
          const sinLeer = datos.noLeidos.has(item.id);
          return (
            <View
              accessible
              accessibilityLabel={`${sinLeer ? 'No leído. ' : ''}${tipo.texto}. ${item.mensaje}. ${formatearAntiguedad(item.fecha, ahora)}`}
            >
              <Cupon
                izquierda={(sinLeer ? 'NUEVO · ' : '') + tipo.texto.toUpperCase()}
                derecha={
                  <Text style={[tipografia.etiqueta, { color: c.cabeceraSecundario }]}>
                    {formatearAntiguedad(item.fecha, ahora).toUpperCase()}
                  </Text>
                }
              >
                <View style={estilos.mensaje}>
                  <Text style={[tipografia.cuerpoFuerte, { color: c.texto }]}>{item.mensaje}</Text>
                </View>
              </Cupon>
            </View>
          );
        }}
      />
    </>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: espacio.l },
  cabecera: { gap: espacio.m, marginBottom: espacio.l },
  separador: { height: espacio.m },
  mensaje: { padding: espacio.l },
});
