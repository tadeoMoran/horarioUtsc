// Helpers para construir DOM sin innerHTML: todo texto entra por textContent,
// así el contenido que viene de la API nunca se interpreta como HTML.
export const el = (etiqueta, propiedades = {}, ...hijos) => {
  const nodo = document.createElement(etiqueta);
  for (const [clave, valor] of Object.entries(propiedades)) {
    if (valor === null || valor === undefined || valor === false) continue;
    if (clave === 'clase') nodo.className = valor;
    else if (clave === 'texto') nodo.textContent = valor;
    else if (clave.startsWith('on')) nodo.addEventListener(clave.slice(2), valor);
    else nodo.setAttribute(clave, valor === true ? '' : valor);
  }
  nodo.append(...hijos.flat().filter((h) => h !== null && h !== undefined && h !== false));
  return nodo;
};

export const icono = (nombre) => el('i', { clase: `bi bi-${nombre}`, 'aria-hidden': 'true' });

export const formatearFecha = (iso) =>
  new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  );

// Mismo texto, mismo color: la pestaña de una materia es estable entre sesiones.
export const indiceColor = (texto, cantidad) => {
  let suma = 0;
  for (const caracter of texto) suma = (suma * 31 + caracter.codePointAt(0)) % 9973;
  return suma % cantidad;
};
