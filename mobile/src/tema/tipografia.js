// Escala de texto. React Native respeta el tamaño de letra del sistema (Dynamic Type / sp)
// mientras no se desactive `allowFontScaling`, así que aquí solo se definen los tamaños base.
export const tipografia = {
  titulo: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  subtitulo: { fontSize: 20, fontWeight: '600', lineHeight: 26 },
  cuerpo: { fontSize: 17, fontWeight: '400', lineHeight: 24 },
  cuerpoFuerte: { fontSize: 17, fontWeight: '600', lineHeight: 24 },
  detalle: { fontSize: 15, fontWeight: '400', lineHeight: 20 },
  pie: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  numerica: { fontVariant: ['tabular-nums'] },
  // Cabeceras y rótulos de campo del cupón: mayúsculas con letras espaciadas.
  etiqueta: { fontSize: 12, fontWeight: '700', lineHeight: 16, letterSpacing: 1.5 },
  // Cifras de campo fijo (hora y aula) del cupón grande.
  cifra: { fontSize: 34, fontWeight: '700', lineHeight: 40, fontVariant: ['tabular-nums'] },
};

export const espacio = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 };

// Esquinas casi rectas: papel de cupón, no tarjeta blanda.
export const radio = { s: 2, m: 4, l: 6 };

// Área táctil mínima: 44 pt en iOS, 48 dp en Android.
export const AREA_TACTIL = 48;
