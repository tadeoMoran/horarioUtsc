import { api } from './api.js';
import { DIAS, TIPOS_AVISO } from './constantes.js';
import { el, formatearFecha, icono } from './dom.js';
import { mostrarError, mostrarMensaje } from './mensajes.js';

const formulario = document.getElementById('avisos-formulario');
const selectorClase = document.getElementById('aviso-clase');
const mensaje = document.getElementById('aviso-mensaje');
const contador = document.getElementById('aviso-contador');
const lista = document.getElementById('avisos-lista');

let grupoId = null;

const ICONOS_TIPO = { cambio_aula: 'geo-alt', clase_cancelada: 'x-circle', general: 'megaphone' };

export const llenarClases = (clases) => {
  const opciones = clases.map((c) =>
    el('option', { value: c.id }, `${DIAS[c.dia_semana]} ${c.hora_inicio} · ${c.materia}`),
  );
  selectorClase.replaceChildren(
    el('option', { value: '' }, 'Ninguna (aviso del grupo)'),
    ...opciones,
  );
};

const tarjetaAviso = (aviso) =>
  el(
    'li',
    { clase: 'hu-cupon' },
    el(
      'div',
      { clase: 'hu-cupon__cabecera' },
      el(
        'span',
        {},
        icono(ICONOS_TIPO[aviso.tipo] ?? 'megaphone'),
        ` ${TIPOS_AVISO[aviso.tipo] ?? aviso.tipo}`,
      ),
      el('span', { clase: 'hu-cupon__cabecera--secundario' }, formatearFecha(aviso.fecha)),
    ),
    el('p', { clase: 'p-3 mb-0' }, aviso.mensaje),
  );

export const cargarAvisos = async (id) => {
  grupoId = id;
  try {
    const avisos = await api.avisos(id);
    lista.replaceChildren(
      ...(avisos.length
        ? avisos.map(tarjetaAviso)
        : [el('li', { clase: 'text-secondary py-3' }, 'Todavía no hay avisos para este grupo.')]),
    );
  } catch (error) {
    mostrarError(error);
  }
};

const publicar = async (evento) => {
  evento.preventDefault();
  formulario.classList.add('was-validated');
  if (!formulario.checkValidity()) return;

  const boton = formulario.querySelector('[type="submit"]');
  boton.disabled = true;
  try {
    const f = formulario.elements;
    await api.publicarAviso({
      grupo_id: grupoId,
      tipo: f.tipo.value,
      mensaje: f.mensaje.value.trim(),
      ...(f.clase_id.value && { clase_id: Number(f.clase_id.value) }),
    });
    mostrarMensaje('Aviso publicado.');
    formulario.reset();
    formulario.classList.remove('was-validated');
    actualizarContador();
    await cargarAvisos(grupoId);
  } catch (error) {
    mostrarError(error);
  } finally {
    boton.disabled = false;
  }
};

const actualizarContador = () => {
  contador.textContent = `${mensaje.value.length} / ${mensaje.maxLength}`;
};

export const iniciarAvisos = () => {
  formulario.addEventListener('submit', publicar);
  mensaje.addEventListener('input', actualizarContador);
  actualizarContador();
};
