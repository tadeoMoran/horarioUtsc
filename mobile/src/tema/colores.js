import { useColorScheme } from 'react-native';

// Dirección «Cartera de boletos»: cabeceras de cupón azul marino sobre papel blanco, cifras
// llenadas «a carbón» en morado y sello rojo para lo cancelado. Los valores cumplen 4.5:1.
// Los colores de materia son decorativos: nunca comunican estado.
const claro = {
  fondo: '#E9ECF2',
  superficie: '#FFFFFF',
  texto: '#0B2A5B',
  textoSecundario: '#4A5878',
  borde: '#B9C0CF',
  acento: '#5B3FA0',
  carbon: '#5B3FA0',
  liston: '#D7192D',
  textoEnCurso: '#BF1226',
  peligro: '#B3261E',
  sobreAcento: '#FFFFFF',
  cabecera: '#0B2A5B',
  cabeceraTexto: '#FFFFFF',
  cabeceraSecundario: '#C7D2EA',
  fichaCambio: '#F2B630',
  fichaCambioTexto: '#0B2A5B',
  fichaCancelada: '#D7192D',
  fichaCanceladaTexto: '#FFFFFF',
  avisoSinLeer: '#D7192D',
};

const oscuro = {
  fondo: '#0A1226',
  superficie: '#131E3B',
  texto: '#EEF2FA',
  textoSecundario: '#A9B5D0',
  borde: '#2B3A5F',
  acento: '#BDA9F7',
  carbon: '#BDA9F7',
  liston: '#FF6B7D',
  textoEnCurso: '#FF8A9B',
  peligro: '#FF8A8A',
  sobreAcento: '#0A1226',
  cabecera: '#20407F',
  cabeceraTexto: '#FFFFFF',
  cabeceraSecundario: '#D6E0F5',
  fichaCambio: '#F2B630',
  fichaCambioTexto: '#0B2A5B',
  fichaCancelada: '#D7192D',
  fichaCanceladaTexto: '#FFFFFF',
  avisoSinLeer: '#FF8A9B',
};

export const COLORES_MATERIA = ['#6C4AB6', '#0E8A7D', '#F28C28', '#D1345B', '#2F6FB5', '#7A8A2F'];

export const useColores = () => (useColorScheme() === 'dark' ? oscuro : claro);

export const colorDeMateria = (nombre) => {
  let suma = 0;
  for (const caracter of nombre) suma = (suma * 31 + caracter.codePointAt(0)) % 9973;
  return COLORES_MATERIA[suma % COLORES_MATERIA.length];
};
