export const DIAS = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
};

export const DIAS_CORTOS = { 1: 'L', 2: 'M', 3: 'X', 4: 'J', 5: 'V', 6: 'S', 7: 'D' };

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

// 1 = lunes … 7 = domingo, igual que `dia_semana` en la API.
export const diaSemanaDe = (fecha) => ((fecha.getDay() + 6) % 7) + 1;

export const aMinutos = (hhmm) => {
  const [horas, minutos] = hhmm.split(':').map(Number);
  return horas * 60 + minutos;
};

export const minutosDe = (fecha) => fecha.getHours() * 60 + fecha.getMinutes();

export const formatearFechaLarga = (fecha) =>
  `${DIAS[diaSemanaDe(fecha)]}, ${fecha.getDate()} de ${MESES[fecha.getMonth()]}`;

const dosDigitos = (n) => String(n).padStart(2, '0');

export const formatearHora = (fecha) =>
  `${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;

const mismaFecha = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// «hoy, 06:45», «ayer, 18:10» o «hace 3 días».
export const formatearActualizacion = (marcaDeTiempo, ahora = new Date()) => {
  const fecha = new Date(marcaDeTiempo);
  const ayer = new Date(ahora);
  ayer.setDate(ahora.getDate() - 1);
  if (mismaFecha(fecha, ahora)) return `hoy, ${formatearHora(fecha)}`;
  if (mismaFecha(fecha, ayer)) return `ayer, ${formatearHora(fecha)}`;
  const dias = Math.floor((ahora - fecha) / 86_400_000);
  return `hace ${dias} días`;
};

// «Hace 20 min», «Hace 1 h», «Ayer» o «Hace 3 días» para la lista de avisos.
export const formatearAntiguedad = (marcaDeTiempo, ahora = new Date()) => {
  const minutos = Math.max(0, Math.floor((ahora - new Date(marcaDeTiempo)) / 60_000));
  if (minutos < 1) return 'Ahora';
  if (minutos < 60) return `Hace ${minutos} min`;
  if (minutos < 24 * 60) return `Hace ${Math.floor(minutos / 60)} h`;
  const dias = Math.floor(minutos / (24 * 60));
  return dias === 1 ? 'Ayer' : `Hace ${dias} días`;
};

// «25 min» o «1 h 05 min».
export const formatearDuracion = (minutos) => {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto ? `${horas} h ${dosDigitos(resto)} min` : `${horas} h`;
};

// Fechas de lunes a sábado de la semana que contiene `referencia`.
export const fechasDeLaSemana = (referencia = new Date()) => {
  const lunes = new Date(referencia);
  lunes.setHours(0, 0, 0, 0);
  lunes.setDate(lunes.getDate() - (diaSemanaDe(lunes) - 1));
  return [1, 2, 3, 4, 5, 6].map((dia) => {
    const fecha = new Date(lunes);
    fecha.setDate(lunes.getDate() + dia - 1);
    return { dia, fecha };
  });
};
