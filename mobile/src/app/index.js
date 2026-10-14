import { Redirect } from 'expo-router';
import { useGrupo } from '@/contexto/GrupoContext';

// Punto de entrada: decide si hay un grupo guardado o hay que elegirlo.
export default function Entrada() {
  const { grupo } = useGrupo();
  return <Redirect href={grupo ? '/inicio' : '/elegir-grupo'} />;
}
