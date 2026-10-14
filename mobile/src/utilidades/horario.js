import { aMinutos } from './tiempo';

export const clasesDelDia = (clases, dia) =>
  clases
    .filter((clase) => clase.dia_semana === dia)
    .sort((a, b) => aMinutos(a.hora_inicio) - aMinutos(b.hora_inicio));

const estaEnCurso = (clase, ahoraMin) =>
  aMinutos(clase.hora_inicio) <= ahoraMin && ahoraMin < aMinutos(clase.hora_fin);

// Qué le importa al alumno ahora mismo. Las clases canceladas no cuentan como «sigue».
export const situacionDelDia = (clasesDia, ahoraMin) => {
  const vigentes = clasesDia.filter((clase) => clase.estado !== 'cancelada');
  const actual = vigentes.find((clase) => estaEnCurso(clase, ahoraMin)) ?? null;
  const siguiente = vigentes.find((clase) => aMinutos(clase.hora_inicio) > ahoraMin) ?? null;

  let fase = 'sin_clases';
  if (clasesDia.length > 0) fase = 'terminado';
  if (actual) fase = 'en_curso';
  else if (siguiente) fase = 'por_empezar';

  return {
    fase,
    actual,
    siguiente,
    minutosParaSiguiente: siguiente ? aMinutos(siguiente.hora_inicio) - ahoraMin : null,
    minutosParaTerminar: actual ? aMinutos(actual.hora_fin) - ahoraMin : null,
  };
};

export const idsEnCurso = (clasesDia, ahoraMin) =>
  new Set(
    clasesDia
      .filter((clase) => clase.estado !== 'cancelada' && estaEnCurso(clase, ahoraMin))
      .map((clase) => clase.id),
  );

export const agruparPorDia = (clases) => {
  const dias = [...new Set(clases.map((c) => c.dia_semana))].sort((a, b) => a - b);
  return dias.map((dia) => ({ dia, clases: clasesDelDia(clases, dia) }));
};

export const etiquetaGrupo = (grupo) => `${grupo.cuatrimestre}° ${grupo.letra}`;
