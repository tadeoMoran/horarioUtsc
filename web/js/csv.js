// Lector de CSV para importar horarios. Funciona con coma, punto y coma o tabulador
// (Excel en español suele guardar con «;») y con o sin comillas.

const DIAS_POR_NOMBRE = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 };

const ENCABEZADOS = {
  materia: 'materia',
  docente: 'docente',
  dia: 'dia_semana',
  dia_semana: 'dia_semana',
  inicio: 'hora_inicio',
  hora_inicio: 'hora_inicio',
  fin: 'hora_fin',
  hora_fin: 'hora_fin',
  aula: 'aula',
};

const OBLIGATORIAS = ['materia', 'dia_semana', 'hora_inicio', 'hora_fin', 'aula'];

const sinAcentos = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

const detectarSeparador = (primeraLinea) => {
  const candidatos = [',', ';', '\t'];
  return candidatos.reduce(
    (mejor, s) => (primeraLinea.split(s).length > primeraLinea.split(mejor).length ? s : mejor),
    ',',
  );
};

// Devuelve las filas como arreglos de celdas, ignorando líneas vacías.
export const parsearCsv = (texto) => {
  const limpio = texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto;
  const separador = detectarSeparador(limpio.split(/\r?\n/, 1)[0] ?? '');
  const filas = [];
  let fila = [];
  let celda = '';
  let entreComillas = false;

  const cerrarFila = () => {
    fila.push(celda);
    if (fila.some((c) => c.trim() !== '')) filas.push(fila);
    fila = [];
    celda = '';
  };

  for (let i = 0; i < limpio.length; i += 1) {
    const caracter = limpio[i];
    if (entreComillas) {
      if (caracter === '"' && limpio[i + 1] === '"') {
        celda += '"';
        i += 1;
      } else if (caracter === '"') {
        entreComillas = false;
      } else {
        celda += caracter;
      }
    } else if (caracter === '"') {
      entreComillas = true;
    } else if (caracter === separador) {
      fila.push(celda);
      celda = '';
    } else if (caracter === '\n') {
      cerrarFila();
    } else if (caracter !== '\r') {
      celda += caracter;
    }
  }
  if (celda !== '' || fila.length > 0) cerrarFila();
  return filas;
};

export const normalizarDia = (valor) => {
  const texto = sinAcentos(valor);
  if (/^[1-7]$/.test(texto)) return Number(texto);
  return DIAS_POR_NOMBRE[texto] ?? null;
};

// «7:00» → «07:00»; también acepta «7:00:00».
export const normalizarHora = (valor) => {
  const coincide = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(valor.trim());
  if (!coincide) return null;
  return `${coincide[1].padStart(2, '0')}:${coincide[2]}`;
};

// Convierte el texto del archivo en filas listas para la API y errores de formato.
// `numero` es la línea del archivo (el encabezado es la 1) para que se ubique en Excel.
export const filasDeCsv = (texto) => {
  const celdas = parsearCsv(texto);
  if (celdas.length === 0)
    return { filas: [], errores: [{ numero: 1, mensaje: 'El archivo está vacío.' }] };

  const columnas = celdas[0].map((c) => ENCABEZADOS[sinAcentos(c).replace(/\s+/g, '_')] ?? null);
  const faltan = OBLIGATORIAS.filter((campo) => !columnas.includes(campo));
  if (faltan.length > 0) {
    return {
      filas: [],
      errores: [{ numero: 1, mensaje: `Faltan columnas: ${faltan.join(', ')}.` }],
    };
  }

  const filas = [];
  const errores = [];
  celdas.slice(1).forEach((valores, posicion) => {
    const numero = posicion + 2;
    const dato = {};
    columnas.forEach((campo, i) => {
      if (campo) dato[campo] = (valores[i] ?? '').trim();
    });

    const dia = normalizarDia(dato.dia_semana ?? '');
    const inicio = normalizarHora(dato.hora_inicio ?? '');
    const fin = normalizarHora(dato.hora_fin ?? '');
    const problemas = [];
    if (dia === null) problemas.push(`día no reconocido «${dato.dia_semana}»`);
    if (inicio === null) problemas.push(`hora de inicio inválida «${dato.hora_inicio}»`);
    if (fin === null) problemas.push(`hora de fin inválida «${dato.hora_fin}»`);
    if (problemas.length > 0) {
      errores.push({ numero, mensaje: problemas.join('; ') });
      return;
    }

    filas.push({
      numero,
      materia: dato.materia,
      ...(dato.docente && { docente: dato.docente }),
      dia_semana: dia,
      hora_inicio: inicio,
      hora_fin: fin,
      aula: dato.aula,
    });
  });
  return { filas, errores };
};
