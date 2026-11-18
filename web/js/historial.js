import { api } from './api.js';
import { DIAS, ESTADOS, ETIQUETAS_CAMPO } from './constantes.js';
import { el, formatearFecha } from './dom.js';
import { mostrarError } from './mensajes.js';

const cuerpo = document.getElementById('historial-cuerpo');
const formulario = document.getElementById('historial-filtros');
const selectorAdministrador = document.getElementById('historial-administrador');
const selectorCampo = document.getElementById('historial-campo');

let grupoActual = null;
let limpiandoPorCambioDeGrupo = false;

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

const filtrosActivos = () => Object.fromEntries(new FormData(formulario));

const filaVacia = (mensaje) =>
  el('tr', {}, el('td', { colspan: '4', clase: 'text-secondary py-3' }, mensaje));

const llenarOpcionesCampo = () => {
  selectorCampo.replaceChildren(
    el('option', { value: '' }, 'Todo'),
    ...Object.entries(ETIQUETAS_CAMPO).map(([valor, etiqueta]) =>
      el('option', { value: valor }, etiqueta),
    ),
  );
};

// Solo se ofrecen los administradores que hicieron cambios en este grupo.
const llenarOpcionesAdministrador = async (grupoId) => {
  const administradores = await api.administradoresHistorial(grupoId);
  selectorAdministrador.replaceChildren(
    el('option', { value: '' }, 'Todos'),
    ...administradores.map(({ id, nombre }) => el('option', { value: id }, nombre)),
  );
};

export const cargarHistorial = async (grupoId) => {
  const cambiaGrupo = grupoId !== grupoActual;
  grupoActual = grupoId;
  try {
    if (cambiaGrupo) {
      limpiandoPorCambioDeGrupo = true;
      formulario.reset(); // El evento `reset` se dispara de inmediato y se ignora.
      limpiandoPorCambioDeGrupo = false;
      await llenarOpcionesAdministrador(grupoId);
    }
    const filtros = filtrosActivos();
    const cambios = await api.historial(grupoId, filtros);
    if (grupoId !== grupoActual) return; // Se cambió de grupo mientras llegaba la respuesta.
    const hayFiltros = Object.values(filtros).some(Boolean);
    cuerpo.replaceChildren(
      ...(cambios.length
        ? cambios.map(fila)
        : [
            filaVacia(
              hayFiltros
                ? 'Ningún cambio coincide con los filtros.'
                : 'Aún no hay cambios registrados.',
            ),
          ]),
    );
  } catch (error) {
    mostrarError(error);
  }
};

// Llamar cuando cambia el grupo: el historial se vuelve a pedir al abrir su pestaña.
export const reiniciarHistorial = () => {
  grupoActual = null;
};

export const iniciarHistorial = () => {
  llenarOpcionesCampo();
  const recargar = () => cargarHistorial(grupoActual);
  formulario.addEventListener('change', recargar);
  // `reset` limpia los campos después del evento, así que se recarga en el siguiente ciclo.
  formulario.addEventListener('reset', () => {
    if (!limpiandoPorCambioDeGrupo) setTimeout(recargar);
  });
};
