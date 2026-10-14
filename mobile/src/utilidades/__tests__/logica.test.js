import { agruparPorDia, clasesDelDia, idsEnCurso, situacionDelDia } from '../horario';
import {
  aMinutos,
  diaSemanaDe,
  fechasDeLaSemana,
  formatearActualizacion,
  formatearAntiguedad,
  formatearDuracion,
  formatearFechaLarga,
} from '../tiempo';

const clase = (id, inicio, fin, estado = 'normal', dia = 2) => ({
  id,
  dia_semana: dia,
  hora_inicio: inicio,
  hora_fin: fin,
  estado,
});

const martes = [
  clase(3, '10:30', '12:10', 'cancelada'),
  clase(1, '07:00', '08:40'),
  clase(2, '08:40', '10:20', 'aula_cambiada'),
];

describe('tiempo', () => {
  test('el día de la semana empieza en lunes', () => {
    expect(diaSemanaDe(new Date(2026, 8, 28))).toBe(1); // lunes
    expect(diaSemanaDe(new Date(2026, 8, 30))).toBe(3);
    expect(diaSemanaDe(new Date(2026, 9, 4))).toBe(7); // domingo
  });

  test('convierte horas a minutos y formatea fechas', () => {
    expect(aMinutos('08:40')).toBe(520);
    expect(formatearFechaLarga(new Date(2026, 8, 29))).toBe('Martes, 29 de septiembre');
  });

  test('formatea duraciones', () => {
    expect(formatearDuracion(25)).toBe('25 min');
    expect(formatearDuracion(65)).toBe('1 h 05 min');
    expect(formatearDuracion(120)).toBe('2 h');
  });

  test('formatea la última actualización y la antigüedad de un aviso', () => {
    const ahora = new Date(2026, 8, 29, 9, 0);
    expect(formatearActualizacion(new Date(2026, 8, 29, 6, 45), ahora)).toBe('hoy, 06:45');
    expect(formatearActualizacion(new Date(2026, 8, 28, 18, 10), ahora)).toBe('ayer, 18:10');
    expect(formatearActualizacion(new Date(2026, 8, 25, 18, 10), ahora)).toBe('hace 3 días');
    expect(formatearAntiguedad(new Date(2026, 8, 29, 8, 40), ahora)).toBe('Hace 20 min');
    expect(formatearAntiguedad(new Date(2026, 8, 29, 7, 0), ahora)).toBe('Hace 2 h');
    expect(formatearAntiguedad(new Date(2026, 8, 28, 9, 0), ahora)).toBe('Ayer');
  });

  test('la semana va de lunes a sábado', () => {
    const semana = fechasDeLaSemana(new Date(2026, 8, 30)); // miércoles
    expect(semana.map((s) => s.fecha.getDate())).toEqual([28, 29, 30, 1, 2, 3]);
  });
});

describe('horario del día', () => {
  test('ordena las clases por hora', () => {
    expect(clasesDelDia(martes, 2).map((c) => c.id)).toEqual([1, 2, 3]);
    expect(clasesDelDia(martes, 3)).toEqual([]);
  });

  test('en curso: hay clase ahora y la siguiente espera', () => {
    const s = situacionDelDia(clasesDelDia(martes, 2), aMinutos('08:15'));
    expect(s.fase).toBe('en_curso');
    expect(s.actual.id).toBe(1);
    expect(s.siguiente.id).toBe(2);
    expect(s.minutosParaSiguiente).toBe(25);
    expect(s.minutosParaTerminar).toBe(25);
  });

  test('por empezar: antes de la primera clase', () => {
    const s = situacionDelDia(clasesDelDia(martes, 2), aMinutos('06:30'));
    expect(s.fase).toBe('por_empezar');
    expect(s.siguiente.id).toBe(1);
    expect(s.minutosParaSiguiente).toBe(30);
  });

  test('la clase cancelada nunca es «la que sigue»', () => {
    const s = situacionDelDia(clasesDelDia(martes, 2), aMinutos('10:25'));
    expect(s.siguiente).toBeNull();
    expect(s.fase).toBe('terminado');
  });

  test('sin clases y fin de jornada', () => {
    expect(situacionDelDia([], aMinutos('09:00')).fase).toBe('sin_clases');
    expect(situacionDelDia(clasesDelDia(martes, 2), aMinutos('13:00')).fase).toBe('terminado');
  });

  test('el límite de fin ya no cuenta como en curso', () => {
    expect([...idsEnCurso(clasesDelDia(martes, 2), aMinutos('08:40'))]).toEqual([2]);
  });

  test('agrupa por día, en orden', () => {
    const grupos = agruparPorDia([clase(9, '07:00', '08:00', 'normal', 4), ...martes]);
    expect(grupos.map((g) => g.dia)).toEqual([2, 4]);
    expect(grupos[0].clases.map((c) => c.id)).toEqual([1, 2, 3]);
  });
});
