import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Boton } from '@/componentes/Boton';
import { CampoCupon, Cupon, Sello } from '@/componentes/Cupon';
import { EstadoPantalla } from '@/componentes/EstadoPantalla';
import { FichaEstado } from '@/componentes/FichaEstado';
import { LineaTalon } from '@/componentes/LineaTalon';
import { useGrupo } from '@/contexto/GrupoContext';
import { useHorario } from '@/hooks/useHorario';
import { useRecordatorio } from '@/hooks/useRecordatorio';
import { horariosService } from '@/servicios/horariosService';
import { useColores } from '@/tema/colores';
import { espacio, tipografia } from '@/tema/tipografia';
import { etiquetaGrupo } from '@/utilidades/horario';
import { DIAS } from '@/utilidades/tiempo';

export default function DetalleClase() {
  const c = useColores();
  const { id } = useLocalSearchParams();
  const { grupo } = useGrupo();
  const { clases, fase } = useHorario(grupo.id);
  const [aulaAnterior, setAulaAnterior] = useState(null);

  // Datos base desde el horario guardado (funciona sin conexión).
  const clase = clases.find((c_) => String(c_.id) === String(id));
  const recordatorio = useRecordatorio(clase);

  // Solo el detalle trae el aula anterior; si falla la red, se omite.
  useEffect(() => {
    let cancelado = false;
    horariosService
      .detalleClase(id)
      .then((detalle) => !cancelado && setAulaAnterior(detalle.aula_anterior))
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [id]);

  if (!clase) {
    return fase === 'cargando' ? (
      <EstadoPantalla cargando titulo="Cargando clase" />
    ) : (
      <EstadoPantalla
        icono="help-circle-outline"
        titulo="No encontramos esta clase"
        texto="Puede que el administrador la haya eliminado del horario."
      />
    );
  }

  const cancelada = clase.estado === 'cancelada';
  const cambioAula = clase.estado === 'aula_cambiada';

  return (
    <ScrollView contentContainerStyle={estilos.contenido}>
      <Cupon
        izquierda="PASE DE CLASE"
        derecha={cambioAula ? <FichaEstado tipo="aula_cambiada" /> : null}
      >
        <View style={estilos.cuerpo}>
          <View>
            <Text style={[tipografia.etiqueta, { color: c.textoSecundario }]}>MATERIA</Text>
            <Text
              style={[tipografia.titulo, { color: c.texto }, cancelada && estilos.tachada]}
              accessibilityRole="header"
            >
              {clase.materia}
            </Text>
          </View>
          {cancelada && <Sello texto="CANCELADA" />}
          <View style={estilos.fila}>
            <CampoCupon etiqueta="DÍA" valor={DIAS[clase.dia_semana]} />
            <CampoCupon
              etiqueta="AULA"
              valor={clase.aula}
              secundario={cambioAula && aulaAnterior ? `antes: ${aulaAnterior}` : null}
              grande
            />
          </View>
          <View style={estilos.fila}>
            <CampoCupon etiqueta="ENTRADA" valor={clase.hora_inicio} grande />
            <CampoCupon etiqueta="SALIDA" valor={clase.hora_fin} grande />
          </View>
        </View>

        <LineaTalon />

        <View style={estilos.talon}>
          <View style={estilos.fila}>
            <CampoCupon etiqueta="DOCENTE" valor={clase.docente ?? 'Sin registrar'} />
            <CampoCupon etiqueta="GRUPO" valor={etiquetaGrupo(grupo)} secundario={grupo.carrera} />
          </View>
        </View>
      </Cupon>

      {!cancelada && (
        <View style={estilos.accion}>
          <Boton
            etiqueta={recordatorio.activo ? 'Quitar recordatorio' : 'Recordarme 15 min antes'}
            variante={recordatorio.activo ? 'secundario' : 'primario'}
            deshabilitado={recordatorio.ocupado}
            alPresionar={recordatorio.alternar}
          />
          <Text style={[tipografia.pie, { color: c.textoSecundario }]}>
            {recordatorio.activo
              ? `Te avisaremos cada ${DIAS[clase.dia_semana].toLowerCase()}, 15 min antes de que empiece.`
              : 'El recordatorio se repite cada semana y se ajusta solo si el horario cambia.'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: espacio.l, gap: espacio.l },
  cuerpo: { padding: espacio.l, gap: espacio.l },
  talon: { padding: espacio.l },
  fila: { flexDirection: 'row', gap: espacio.l },
  tachada: { textDecorationLine: 'line-through' },
  accion: { gap: espacio.s },
});
