import { aMinutos } from './tiempo';

export const MINUTOS_ANTES = 15;

// expo-notifications numera los días con 1 = domingo … 7 = sábado;
// la API de HorarioUTSC usa 1 = lunes … 7 = domingo.
export const weekdayDeExpo = (dia) => (dia === 7 ? 1 : dia + 1);

// Cuándo debe sonar el aviso de una clase: MINUTOS_ANTES antes, el mismo día de cada semana.
// Si la clase empieza muy temprano, el aviso cae en la noche del día anterior.
export const calcularDisparo = (clase, minutosAntes = MINUTOS_ANTES) => {
  let minutos = aMinutos(clase.hora_inicio) - minutosAntes;
  let dia = clase.dia_semana;
  if (minutos < 0) {
    minutos += 24 * 60;
    dia = dia === 1 ? 7 : dia - 1;
  }
  return { weekday: weekdayDeExpo(dia), hour: Math.floor(minutos / 60), minute: minutos % 60 };
};

// Si algo de esto cambia, el recordatorio guardado ya no es válido y hay que reprogramarlo.
export const firmaDe = (clase) =>
  [clase.materia, clase.dia_semana, clase.hora_inicio, clase.aula].join('|');
