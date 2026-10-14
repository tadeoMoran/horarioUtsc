import { calcularDisparo, firmaDe, weekdayDeExpo } from '../recordatorios';

const clase = (dia, inicio) => ({
  id: 1,
  materia: 'Bases de Datos',
  dia_semana: dia,
  hora_inicio: inicio,
  aula: 'Aula 12',
});

describe('recordatorios', () => {
  test('convierte los días a la numeración de Expo (1 = domingo)', () => {
    expect(weekdayDeExpo(1)).toBe(2); // lunes
    expect(weekdayDeExpo(6)).toBe(7); // sábado
    expect(weekdayDeExpo(7)).toBe(1); // domingo
  });

  test('avisa 15 minutos antes el mismo día', () => {
    expect(calcularDisparo(clase(2, '08:40'))).toEqual({ weekday: 3, hour: 8, minute: 25 });
    expect(calcularDisparo(clase(2, '07:00'))).toEqual({ weekday: 3, hour: 6, minute: 45 });
  });

  test('si la clase empieza antes de las 00:15, el aviso cae el día anterior', () => {
    expect(calcularDisparo(clase(2, '00:10'))).toEqual({ weekday: 2, hour: 23, minute: 55 });
    expect(calcularDisparo(clase(1, '00:00'))).toEqual({ weekday: 1, hour: 23, minute: 45 });
  });

  test('la firma cambia cuando cambia el aula, la hora, el día o la materia', () => {
    const base = firmaDe(clase(2, '08:40'));
    expect(firmaDe(clase(2, '08:40'))).toBe(base);
    expect(firmaDe({ ...clase(2, '08:40'), aula: 'Aula 7' })).not.toBe(base);
    expect(firmaDe(clase(3, '08:40'))).not.toBe(base);
    expect(firmaDe(clase(2, '09:00'))).not.toBe(base);
  });
});
