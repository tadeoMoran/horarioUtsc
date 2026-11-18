// Puebla carreras, grupos, materias y clases SINTÉTICAS para desarrollo y demostración.
// No son horarios reales de la UTSC: las carreras salen de su oferta educativa pública
// (utsc.edu.mx) y las materias y horarios son inventados con criterio.
//
// Uso (desde api/):
//   node scripts/poblar-catalogo.mjs --simular            Genera y resume, no toca la base.
//   node scripts/poblar-catalogo.mjs --aplicar            Respalda la base y aplica en una transacción.
//   node scripts/poblar-catalogo.mjs --revertir <archivo> Deshace lo que registró un --aplicar.
//
// --aplicar guarda dos archivos en api/backups/ (fuera de Git):
//   respaldo-<fecha>.json    copia completa de las tablas antes de cambiar nada.
//   rollback-<fecha>.json    ids exactos de lo que se agregó, para --revertir.
// Es idempotente: no duplica grupos que ya existen y solo les crea clases a los grupos nuevos.

import 'dotenv/config';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import pg from 'pg';

const TOTAL_GRUPOS = 50; // Contando los que ya existen en la base.
const BLOQUE_MIN = 40; // Cada clase dura 40 minutos.
const BLOQUES_MAX_DIA = 8;

// ---------------------------------------------------------------- Catálogo
// "*" al inicio marca una materia de laboratorio/taller (se asigna a un Lab.).
// Cada carrera tiene 5 bloques de 6 materias: cuatrimestres 1-2, 3-4, 5-6, 7-8 y 9-10.
const CARRERAS = [
  {
    nombre: 'Ing. en Desarrollo y Gestión de Software',
    // [cuatrimestre, letra]
    grupos: ['1A', '1B', '3C', '4A', '6D', '8A', '9E'],
    bloques: [
      ['*Fundamentos de Programación', 'Matemáticas para Ingeniería', 'Introducción a las Tecnologías de la Información', 'Expresión Oral y Escrita I', 'Inglés I', 'Habilidades Socioemocionales y Manejo de Conflictos'],
      ['*Programación Orientada a Objetos', '*Estructuras de Datos', '*Bases de Datos', 'Álgebra Lineal', 'Inglés III', 'Desarrollo Humano y Valores'],
      ['*Desarrollo Web', '*Programación de Base de Datos', 'Ingeniería de Software', 'Probabilidad y Estadística', 'Inglés V', 'Proyecto Integrador I'],
      ['Arquitectura de Software', '*Desarrollo Móvil Multiplataforma', 'Pruebas y Calidad de Software', 'Gestión de Proyectos de TI', 'Seguridad Informática', 'Inglés VII'],
      ['*Desarrollo Móvil Integral', '*Computación en la Nube', '*Bases de Datos No Relacionales', 'Inteligencia Artificial', 'Gestión de Proyectos de Software', 'Inglés IX'],
    ],
  },
  {
    nombre: 'Ing. en Mecatrónica',
    grupos: ['1C', '2A', '3B', '5A', '6E', '7B', '10A'],
    bloques: [
      ['*Física Aplicada', 'Matemáticas para Ingeniería', 'Dibujo Técnico', '*Fundamentos de Electricidad', 'Inglés I', 'Expresión Oral y Escrita I'],
      ['*Electrónica Analógica', 'Cálculo Diferencial', '*Neumática e Hidráulica', 'Estática', 'Inglés III', 'Desarrollo Humano y Valores'],
      ['*Controladores Lógicos Programables', '*Electrónica Digital', 'Cálculo Integral', 'Dinámica', 'Inglés V', 'Proyecto Integrador I'],
      ['*Automatización Industrial', '*Robótica', 'Sistemas de Control', 'Diseño Mecánico', 'Inglés VII', 'Gestión de Proyectos de Ingeniería'],
      ['*Mecatrónica Avanzada', '*Control Inteligente', '*Visión Artificial', 'Manufactura Integrada por Computadora', 'Inglés IX', 'Administración de Proyectos de Automatización'],
    ],
  },
  {
    nombre: 'Ing. en Mantenimiento Industrial',
    grupos: ['1D', '2B', '4B', '5C', '7C', '8E', '9A'],
    bloques: [
      ['Matemáticas para Ingeniería', '*Fundamentos de Electricidad', 'Seguridad e Higiene Industrial', '*Metrología y Dibujo Técnico', 'Inglés I', 'Expresión Oral y Escrita I'],
      ['*Mantenimiento Preventivo', '*Neumática e Hidráulica', 'Estática', '*Electricidad Industrial', 'Inglés III', 'Desarrollo Humano y Valores'],
      ['*Mantenimiento Correctivo y Predictivo', '*Sistemas de Lubricación', 'Termodinámica', '*Controladores Lógicos Programables', 'Inglés V', 'Proyecto Integrador I'],
      ['Gestión del Mantenimiento', '*Mantenimiento de Máquinas Eléctricas', 'Confiabilidad y Análisis de Fallas', 'Costos y Presupuestos', 'Inglés VII', 'Gestión de Proyectos de Ingeniería'],
      ['*Mantenimiento Predictivo Avanzado', 'Gestión de Activos Industriales', 'Normatividad y Seguridad Industrial', 'Mejora Continua', 'Inglés IX', 'Administración de Proyectos de Mantenimiento'],
    ],
  },
  {
    nombre: 'Ing. Industrial',
    grupos: ['1E', '2C', '3D', '4E', '6A', '7D', '10C'],
    bloques: [
      ['Matemáticas para Ingeniería', 'Fundamentos de Procesos Industriales', 'Dibujo Técnico', '*Física Aplicada', 'Inglés I', 'Expresión Oral y Escrita I'],
      ['Estadística para Ingeniería', '*Procesos de Manufactura', 'Ciencia de los Materiales', 'Estudio del Trabajo', 'Inglés III', 'Desarrollo Humano y Valores'],
      ['*Control Estadístico de la Calidad', 'Planeación de la Producción', 'Ergonomía', 'Cálculo Integral', 'Inglés V', 'Proyecto Integrador I'],
      ['Ingeniería de Métodos', 'Logística y Cadena de Suministro', '*Simulación de Procesos', 'Sistemas de Gestión de la Calidad', 'Inglés VII', 'Costos Industriales'],
      ['Manufactura Esbelta', 'Seis Sigma', 'Gestión de la Cadena de Suministro', 'Diseño de Instalaciones Industriales', 'Inglés IX', 'Gestión de Proyectos de Ingeniería'],
    ],
  },
  {
    nombre: 'Ing. en Electromovilidad',
    grupos: ['1A', '2D', '3A', '5B', '6C', '8B', '9C'],
    bloques: [
      ['Matemáticas para Ingeniería', '*Fundamentos de Electricidad', '*Física Aplicada', 'Introducción a la Movilidad Eléctrica', 'Inglés I', 'Expresión Oral y Escrita I'],
      ['*Circuitos Eléctricos', '*Electrónica de Potencia', 'Cálculo Diferencial', '*Mecánica Automotriz Básica', 'Inglés III', 'Desarrollo Humano y Valores'],
      ['*Máquinas Eléctricas', '*Baterías y Almacenamiento de Energía', '*Sistemas Embebidos', 'Cálculo Integral', 'Inglés V', 'Proyecto Integrador I'],
      ['*Motores de Tracción Eléctrica', '*Sistemas de Carga y Electrolineras', 'Redes Vehiculares CAN', 'Sistemas de Control', 'Inglés VII', 'Gestión de Proyectos de Ingeniería'],
      ['*Diagnóstico de Vehículos Eléctricos', '*Gestión de Baterías (BMS)', 'Movilidad Autónoma y Conectada', 'Energías Renovables', 'Inglés IX', 'Gestión de Proyectos de Ingeniería'],
    ],
  },
  {
    nombre: 'Lic. en Negocios y Mercadotecnia',
    grupos: ['1B', '2E', '3E', '4C', '5D', '7E', '9D'],
    bloques: [
      ['Fundamentos de Mercadotecnia', 'Matemáticas Básicas para Negocios', 'Informática para Negocios', 'Contabilidad Básica', 'Inglés I', 'Expresión Oral y Escrita I'],
      ['Comportamiento del Consumidor', 'Estadística para Negocios', 'Publicidad y Promoción', 'Microeconomía', 'Inglés III', 'Desarrollo Humano y Valores'],
      ['Investigación de Mercados', 'Marketing Digital', 'Costos y Presupuestos', 'Ventas y Negociación', 'Inglés V', 'Proyecto Integrador I'],
      ['Planeación Estratégica de Mercadotecnia', 'Comercio Electrónico', 'Branding y Gestión de Marca', 'Finanzas para Negocios', 'Inglés VII', 'Emprendimiento e Innovación'],
      ['Dirección Estratégica', 'Analítica de Datos para Negocios', 'Mercadotecnia Internacional', 'Responsabilidad Social Empresarial', 'Inglés IX', 'Formulación de Proyectos de Negocio'],
    ],
  },
  {
    nombre: 'Lic. en Educación (Enseñanza del Inglés)',
    grupos: ['1C', '3B', '4D', '5E', '6B', '8C', '10D'],
    bloques: [
      ['Gramática del Inglés I', '*Fonética del Inglés', 'Expresión Oral y Escrita I', 'Introducción a la Pedagogía', 'Informática para la Docencia', 'Lengua Inglesa I'],
      ['Gramática del Inglés II', 'Lectura y Redacción en Inglés', 'Psicología del Aprendizaje', 'Didáctica General', 'Lengua Inglesa III', 'Desarrollo Humano y Valores'],
      ['Metodología de la Enseñanza del Inglés', 'Evaluación del Aprendizaje de Idiomas', 'Literatura en Lengua Inglesa', 'Tecnologías para la Enseñanza de Idiomas', 'Lengua Inglesa V', 'Proyecto Integrador I'],
      ['Planeación Didáctica', 'Adquisición de Segundas Lenguas', 'Inglés con Fines Específicos', 'Diseño de Materiales Didácticos', 'Lengua Inglesa VII', 'Investigación Educativa'],
      ['Práctica Docente', 'Gestión Educativa', 'Traducción e Interpretación Básica', 'Currículo y Diseño Instruccional', 'Lengua Inglesa IX', 'Seminario de Titulación'],
    ],
  },
];

// ------------------------------------------------------------- Generación
const mulberry32 = (semilla) => () => {
  semilla = (semilla + 0x6d2b79f5) | 0;
  let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const elegirPonderado = (azar, opciones) => {
  const total = opciones.reduce((suma, [, peso]) => suma + peso, 0);
  let punto = azar() * total;
  for (const [valor, peso] of opciones) {
    punto -= peso;
    if (punto < 0) return valor;
  }
  return opciones.at(-1)[0];
};

// Minuto del día en que empieza el bloque 0 según la letra: A-C matutino, D-E vespertino.
const INICIO_POR_LETRA = { A: 7 * 60, B: 7 * 60, C: 7 * 60 + 40, D: 13 * 60 + 20, E: 14 * 60 };

const hora = (minutos) =>
  `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;

const bandaDe = (cuatrimestre) => Math.min(Math.floor((cuatrimestre - 1) / 2), 4);

// Bloques ocupados de un día para un grupo: empieza tarde, termina temprano y a veces
// deja una hora libre (un hueco de 40 min) en medio. No todos los días son iguales.
const diseñarDia = (azar, ligero) => {
  let inicio = elegirPonderado(azar, [[0, 55], [1, 20], [2, 15], [3, 10]]);
  let fin = elegirPonderado(azar, [[8, 45], [7, 20], [6, 20], [5, 15]]);
  if (ligero) {
    inicio = azar() < 0.5 ? 0 : 2;
    fin = inicio + 3 + Math.floor(azar() * 2);
  }
  fin = Math.min(fin, BLOQUES_MAX_DIA);
  if (fin - inicio < 3) inicio = Math.max(0, fin - 3);

  const bloques = [];
  for (let i = inicio; i < fin; i++) bloques.push(i);
  if (fin - inicio >= 5 && azar() < 0.4) {
    const hueco = inicio + 2 + Math.floor(azar() * (fin - inicio - 4));
    return bloques.filter((b) => b !== hueco);
  }
  return bloques;
};

const generarClasesDeGrupo = ({ indice, letra, materias }, ocupadas) => {
  const azar = mulberry32(indice * 7919 + 13);
  const base = INICIO_POR_LETRA[letra];
  const diaLigero = Math.floor(azar() * 5);
  const aulaBase = (indice % 30) + 1;
  let puntero = Math.floor(azar() * materias.length);
  const clases = [];

  const elegirAula = (esLab, dia, bloques) => {
    const candidatas = esLab
      ? Array.from({ length: 10 }, (_, i) => `Lab. ${i + 1}`)
      : Array.from({ length: 30 }, (_, i) => `Aula ${((aulaBase - 1 + i) % 30) + 1}`);
    const libre = candidatas.find((aula) => bloques.every((b) => !ocupadas.has(`${dia}|${letra}|${b}|${aula}`)));
    return libre ?? candidatas[0];
  };

  for (let dia = 1; dia <= 5; dia++) {
    const bloques = diseñarDia(azar, dia - 1 === diaLigero);
    for (let i = 0; i < bloques.length; ) {
      // Una clase dura 1, 2 o 3 bloques de 40 min seguidos (40, 80 o 120 min).
      const deseados = elegirPonderado(azar, [[1, 30], [2, 45], [3, 25]]);
      let duracion = 1;
      while (duracion < deseados && bloques[i + duracion] === bloques[i] + duracion) duracion++;
      const grupoBloques = bloques.slice(i, i + duracion);
      const materia = materias[puntero++ % materias.length];
      const aula = elegirAula(materia.lab, dia, grupoBloques);
      for (const b of grupoBloques) ocupadas.add(`${dia}|${letra}|${b}|${aula}`);
      const minutos = base + grupoBloques[0] * BLOQUE_MIN;
      clases.push({
        materia: materia.nombre,
        dia_semana: dia,
        hora_inicio: hora(minutos),
        hora_fin: hora(minutos + duracion * BLOQUE_MIN),
        aula,
      });
      i += duracion;
    }
  }
  return clases;
};

const construirPlan = () => {
  const ocupadas = new Set();
  const grupos = [];
  let indice = 0;
  for (const carrera of CARRERAS) {
    for (const codigo of carrera.grupos) {
      const cuatrimestre = Number(codigo.slice(0, -1));
      const letra = codigo.slice(-1);
      const materias = carrera.bloques[bandaDe(cuatrimestre)].map((n) => ({
        nombre: n.replace(/^\*/, ''),
        lab: n.startsWith('*'),
      }));
      const grupo = { carrera: carrera.nombre, cuatrimestre, letra, indice: indice++, materias };
      grupo.clases = generarClasesDeGrupo(grupo, ocupadas);
      grupos.push(grupo);
    }
  }
  return grupos;
};

// -------------------------------------------------------------- Base de datos
const TABLAS = ['carrera', 'grupo', 'materia', 'clase', 'aviso', 'administrador', 'administrador_grupo', 'dispositivo', 'historial_cambio'];

const conectar = async () => {
  if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL en api/.env');
  const cliente = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await cliente.connect();
  return cliente;
};

const marcaDeTiempo = () => new Date().toISOString().replace(/[:.]/g, '-');

const respaldar = async (cliente, ruta) => {
  const copia = {};
  for (const tabla of TABLAS) copia[tabla] = (await cliente.query(`SELECT * FROM ${tabla} ORDER BY 1`)).rows;
  await writeFile(ruta, JSON.stringify(copia, null, 2));
};

const aplicar = async (plan) => {
  const cliente = await conectar();
  try {
    await mkdir(new URL('../backups/', import.meta.url), { recursive: true });
    const sello = marcaDeTiempo();
    const rutaRespaldo = new URL(`../backups/respaldo-${sello}.json`, import.meta.url);
    const rutaRollback = new URL(`../backups/rollback-${sello}.json`, import.meta.url);
    await respaldar(cliente, rutaRespaldo);
    console.log(`Respaldo: ${rutaRespaldo.pathname}`);

    const existentes = (await cliente.query('SELECT COUNT(*)::int AS n FROM grupo')).rows[0].n;
    const nuevos = plan.length;
    if (existentes + nuevos !== TOTAL_GRUPOS) {
      console.log(`Aviso: la base ya tiene ${existentes} grupos; con ${nuevos} nuevos habrá ${existentes + nuevos}.`);
    }

    const agregado = { carreras: [], grupos: [], materias: [] };
    await cliente.query('BEGIN');
    try {
      const idsCarrera = new Map();
      for (const { nombre } of CARRERAS) {
        const insertada = await cliente.query(
          'INSERT INTO carrera (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING RETURNING id',
          [nombre],
        );
        if (insertada.rowCount) agregado.carreras.push(insertada.rows[0].id);
        const id = insertada.rowCount
          ? insertada.rows[0].id
          : (await cliente.query('SELECT id FROM carrera WHERE nombre = $1', [nombre])).rows[0].id;
        idsCarrera.set(nombre, id);
      }

      const idsMateria = new Map();
      const nombresMateria = [...new Set(plan.flatMap((g) => g.materias.map((m) => m.nombre)))];
      for (const nombre of nombresMateria) {
        const insertada = await cliente.query(
          'INSERT INTO materia (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING RETURNING id',
          [nombre],
        );
        if (insertada.rowCount) agregado.materias.push(insertada.rows[0].id);
        const id = insertada.rowCount
          ? insertada.rows[0].id
          : (await cliente.query('SELECT id FROM materia WHERE nombre = $1', [nombre])).rows[0].id;
        idsMateria.set(nombre, id);
      }

      let clasesNuevas = 0;
      for (const grupo of plan) {
        const insertado = await cliente.query(
          `INSERT INTO grupo (carrera_id, cuatrimestre, letra) VALUES ($1, $2, $3)
           ON CONFLICT (carrera_id, cuatrimestre, letra) DO NOTHING RETURNING id`,
          [idsCarrera.get(grupo.carrera), grupo.cuatrimestre, grupo.letra],
        );
        if (!insertado.rowCount) continue; // Ya existía: no se le tocan las clases.
        const grupoId = insertado.rows[0].id;
        agregado.grupos.push(grupoId);
        await cliente.query(
          `INSERT INTO clase (grupo_id, materia_id, dia_semana, hora_inicio, hora_fin, aula)
           SELECT $1, m, d, hi::time, hf::time, a
           FROM unnest($2::int[], $3::smallint[], $4::text[], $5::text[], $6::text[]) AS t(m, d, hi, hf, a)`,
          [
            grupoId,
            grupo.clases.map((c) => idsMateria.get(c.materia)),
            grupo.clases.map((c) => c.dia_semana),
            grupo.clases.map((c) => c.hora_inicio),
            grupo.clases.map((c) => c.hora_fin),
            grupo.clases.map((c) => c.aula),
          ],
        );
        clasesNuevas += grupo.clases.length;
      }

      await cliente.query('COMMIT');
      await writeFile(rutaRollback, JSON.stringify({ creado: new Date().toISOString(), ...agregado }, null, 2));
      console.log(`Rollback: ${rutaRollback.pathname}`);
      console.log(
        `Agregado: ${agregado.carreras.length} carreras, ${agregado.grupos.length} grupos, ` +
          `${agregado.materias.length} materias, ${clasesNuevas} clases.`,
      );
    } catch (error) {
      await cliente.query('ROLLBACK');
      throw error;
    }
  } finally {
    await cliente.end();
  }
};

const revertir = async (archivo) => {
  const { carreras, grupos, materias } = JSON.parse(await readFile(archivo, 'utf8'));
  const cliente = await conectar();
  try {
    await cliente.query('BEGIN');
    try {
      // Las clases, avisos, dispositivos e historial de esos grupos caen en cascada.
      const g = await cliente.query('DELETE FROM grupo WHERE id = ANY($1::int[])', [grupos]);
      const m = await cliente.query(
        `DELETE FROM materia WHERE id = ANY($1::int[])
           AND NOT EXISTS (SELECT 1 FROM clase WHERE clase.materia_id = materia.id)`,
        [materias],
      );
      const c = await cliente.query(
        `DELETE FROM carrera WHERE id = ANY($1::int[])
           AND NOT EXISTS (SELECT 1 FROM grupo WHERE grupo.carrera_id = carrera.id)`,
        [carreras],
      );
      await cliente.query('COMMIT');
      console.log(`Revertido: ${g.rowCount} grupos, ${m.rowCount} materias, ${c.rowCount} carreras.`);
    } catch (error) {
      await cliente.query('ROLLBACK');
      throw error;
    }
  } finally {
    await cliente.end();
  }
};

// ----------------------------------------------------------------------- Main
const [modo, argumento] = process.argv.slice(2);

if (modo === '--revertir' && argumento) {
  await revertir(argumento);
} else if (modo === '--simular' || modo === '--aplicar') {
  const plan = construirPlan();
  const clases = plan.reduce((suma, g) => suma + g.clases.length, 0);
  const materias = new Set(plan.flatMap((g) => g.materias.map((m) => m.nombre)));
  console.log(`Plan: ${CARRERAS.length} carreras, ${plan.length} grupos nuevos, ${materias.size} materias, ${clases} clases.`);
  if (modo === '--simular') {
    const muestra = plan[8];
    console.log(`\nMuestra: ${muestra.carrera} ${muestra.cuatrimestre}${muestra.letra}`);
    for (let d = 1; d <= 5; d++) {
      const dia = muestra.clases.filter((c) => c.dia_semana === d);
      console.log(`  Día ${d} (${dia.length} clases): ${dia[0].hora_inicio}-${dia.at(-1).hora_fin}`);
      for (const c of dia) console.log(`    ${c.hora_inicio}-${c.hora_fin}  ${c.materia} (${c.aula})`);
    }
  } else {
    await aplicar(plan);
  }
} else {
  console.log('Uso: --simular | --aplicar | --revertir <archivo-rollback.json>');
  process.exitCode = 1;
}
