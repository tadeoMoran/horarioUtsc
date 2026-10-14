import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Boton } from '@/componentes/Boton';
import { CampoCupon, Cupon } from '@/componentes/Cupon';
import { useGrupo } from '@/contexto/GrupoContext';
import { useColores } from '@/tema/colores';
import { espacio, tipografia } from '@/tema/tipografia';
import { etiquetaGrupo } from '@/utilidades/horario';

export default function Ajustes() {
  const c = useColores();
  const { grupo, olvidarGrupo } = useGrupo();

  const confirmarCambio = () =>
    Alert.alert(
      'Cambiar de grupo',
      'Volverás a elegir tu carrera y tu grupo. Tu horario guardado se reemplazará.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cambiar', style: 'destructive', onPress: olvidarGrupo },
      ],
    );

  return (
    <>
      <Stack.Screen options={{ title: 'Ajustes' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={estilos.contenido}
      >
        <Cupon izquierda="TU GRUPO">
          <View style={estilos.bloque}>
            <CampoCupon etiqueta="GRUPO" valor={etiquetaGrupo(grupo)} grande />
            <CampoCupon etiqueta="CARRERA" valor={grupo.carrera} />
          </View>
        </Cupon>

        <Boton etiqueta="Cambiar de grupo" variante="secundario" alPresionar={confirmarCambio} />

        <View style={estilos.acerca}>
          <Text style={[tipografia.cuerpoFuerte, { color: c.texto }]}>Sobre HorarioUTSC</Text>
          <Text style={[tipografia.detalle, { color: c.textoSecundario }]}>
            Los horarios y avisos los captura el administrador de tu grupo. Esta app no está
            conectada al sistema de la escuela y sus avisos no son oficiales.
          </Text>
          <Text style={[tipografia.pie, { color: c.textoSecundario }]}>
            Versión {Constants.expoConfig?.version}
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: espacio.l, gap: espacio.l },
  bloque: { padding: espacio.l, gap: espacio.m },
  acerca: { gap: espacio.s, marginTop: espacio.l },
});
