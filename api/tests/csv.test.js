import { filasDeCsv, normalizarDia, normalizarHora, parsearCsv } from '../../web/js/csv.js';

describe('csv del panel web', () => {
  test('lee coma, punto y coma, comillas y BOM', () => {
    expect(parsearCsv('﻿a,b\n1,2\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
    expect(parsearCsv('a;b\r\n"x;y";"di ""hola"""\r\n')).toEqual([
      ['a', 'b'],
      ['x;y', 'di "hola"'],
    ]);
  });

  test('ignora las líneas vacías', () => {
    expect(parsearCsv('a,b\n\n1,2\n,\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  test('normaliza días y horas', () => {
    expect(normalizarDia('Miércoles')).toBe(3);
    expect(normalizarDia('SABADO')).toBe(6);
    expect(normalizarDia('2')).toBe(2);
    expect(normalizarDia('festivo')).toBeNull();
    expect(normalizarHora('7:00')).toBe('07:00');
    expect(normalizarHora('13:45:00')).toBe('13:45');
    expect(normalizarHora('mediodía')).toBeNull();
  });

  test('convierte un archivo completo y numera las líneas como en Excel', () => {
    const { filas, errores } = filasDeCsv(
      'Materia;Docente;Día;Inicio;Fin;Aula\nBases de Datos;;martes;8:40;10:20;Aula 12\nInglés;Docente X;viernes;10:30;12:10;Aula 5\n',
    );
    expect(errores).toEqual([]);
    expect(filas).toEqual([
      {
        numero: 2,
        materia: 'Bases de Datos',
        dia_semana: 2,
        hora_inicio: '08:40',
        hora_fin: '10:20',
        aula: 'Aula 12',
      },
      {
        numero: 3,
        materia: 'Inglés',
        docente: 'Docente X',
        dia_semana: 5,
        hora_inicio: '10:30',
        hora_fin: '12:10',
        aula: 'Aula 5',
      },
    ]);
  });

  test('avisa de columnas faltantes y de filas con datos inválidos', () => {
    expect(filasDeCsv('materia,aula\nX,Y').errores[0].mensaje).toContain('Faltan columnas');
    const { filas, errores } = filasDeCsv(
      'materia,dia,inicio,fin,aula\nA,lunes,7:00,8:40,L1\nB,festivo,7:00,8:40,L2\nC,lunes,xx,8:40,L3\n',
    );
    expect(filas).toHaveLength(1);
    expect(errores.map((e) => e.numero)).toEqual([3, 4]);
    expect(filasDeCsv('').errores[0].mensaje).toContain('vacío');
  });
});
