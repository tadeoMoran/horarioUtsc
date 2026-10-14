import { api } from './api.js';
import { DIAS, ESTADOS, ETIQUETAS_CAMPO } from './constantes.js';
import { el, formatearFecha } from './dom.js';
import { mostrarError } from './mensajes.js';

const cuerpo = document.getElementById('historial-cuerpo');

const legible = (campo, valor) => {
  if (valor === null || valor === undefined) return '—';
  if (campo === 'dia_semana') return DIAS[valor] ?? valor;
  if (campo === 'estado') return ESTADOS[valor] ?? valor;
  return valor;
};

const describirCambio = (cambio) => {
  if (cambio.campo === 'creada') return legible(cambio.campo, cambio.valor_nuevo);
  if (cambio.campo === 'eliminada') return legible(cambio.campo, cambio.valor_anterior);
  return `${legible(cambio.campo, cambio.valor_anterior)} → ${legible(cambio.campo, cambio.valor_nuevo)}`;
};

const fila = (cambio) =>
  el(
    'tr',
    {},
    el('td', { clase: 'text-nowrap hu-hora' }, formatearFecha(cambio.fecha)),
    el('td', {}, cambio.administrador),
    el('td', {}, ETIQUETAS_CAMPO[cambio.campo] ?? cambio.campo),
    el('td', {}, describirCambio(cambio)),
  );

export const cargarHistorial = async (grupoId) => {
  try {
    const cambios = await api.historial(grupoId);
    cuerpo.replaceChildren(
      ...(cambios.length
        ? cambios.map(fila)
        : [
            el(
              'tr',
              {},
              el(
                'td',
                { colspan: '4', clase: 'text-secondary py-3' },
                'Aún no hay cambios registrados.',
              ),
            ),
          ]),
    );
  } catch (error) {
    mostrarError(error);
  }
};
