import { api } from './api.js';
import { CANTIDAD_COLORES_MATERIA, DIAS } from './constantes.js';
import { el, icono, indiceColor } from './dom.js';
import { mostrarError, mostrarMensaje } from './mensajes.js';

const DIAS_VISIBLES = [1, 2, 3, 4, 5, 6];

const formulario = document.getElementById('horario-formulario');
const contenedorFormulario = document.getElementById('horario-formulario-contenedor');
const tituloFormulario = document.getElementById('horario-formulario-titulo');
const lista = document.getElementById('horario-lista');
const selectorDias = document.getElementById('horario-dias');
const botonAgregar = document.getElementById('horario-agregar');
const camposSoloAlta = document.querySelectorAll('[data-solo-alta]');
const camposSoloEdicion = document.querySelectorAll('[data-solo-edicion]');

const estado = { grupoId: null, dia: 1, clases: [], editandoId: null, confirmandoId: null };
let alCambiarClases = () => {};

export const clasesActuales = () => estado.clases;
export const alActualizarClases = (fn) => {
  alCambiarClases = fn;
};

const diaDeHoy = () => {
  const dia = ((new Date().getDay() + 6) % 7) + 1;
  return DIAS_VISIBLES.includes(dia) ? dia : 1;
};

const etiquetaEstado = (clase) => {
  if (clase.estado === 'aula_cambiada') {
    return el('span', { clase: 'hu-ficha hu-ficha--cambio' }, icono('geo-alt'), ' Aula cambió');
  }
  return null;
};

const botonAccion = ({ icon, etiqueta, variante = 'outline-primary', alClic }) =>
  el(
    'button',
    {
      type: 'button',
      clase: `btn btn-sm btn-${variante}`,
      'aria-label': etiqueta,
      title: etiqueta,
      onclick: alClic,
    },
    icono(icon),
  );

const accionesNormales = (clase) => {
  const cancelada = clase.estado === 'cancelada';
  return [
    botonAccion({
      icon: 'pencil',
      etiqueta: `Editar ${clase.materia}`,
      alClic: () => abrirFormulario(clase),
    }),
    botonAccion({
      icon: cancelada ? 'arrow-counterclockwise' : 'x-circle',
      etiqueta: cancelada ? `Restablecer ${clase.materia}` : `Cancelar ${clase.materia}`,
      alClic: () => cambiarEstado(clase, cancelada ? 'normal' : 'cancelada'),
    }),
    botonAccion({
      icon: 'trash',
      etiqueta: `Eliminar ${clase.materia}`,
      variante: 'outline-danger',
      alClic: () => {
        estado.confirmandoId = clase.id;
        renderizarLista();
      },
    }),
  ];
};

const accionesConfirmacion = (clase) => [
  el('span', { clase: 'small me-1', role: 'alert' }, '¿Eliminar esta clase?'),
  el(
    'button',
    { type: 'button', clase: 'btn btn-sm btn-danger', onclick: () => eliminar(clase) },
    'Sí, eliminar',
  ),
  el(
    'button',
    {
      type: 'button',
      clase: 'btn btn-sm btn-outline-secondary',
      onclick: () => {
        estado.confirmandoId = null;
        renderizarLista();
      },
    },
    'No',
  ),
];

const tarjetaClase = (clase) => {
  const cancelada = clase.estado === 'cancelada';
  return el(
    'li',
    { clase: `hu-cupon hu-clase hu-clase--${clase.estado}` },
    el(
      'div',
      { clase: 'hu-cupon__cabecera' },
      el(
        'span',
        { clase: 'd-flex align-items-center gap-2' },
        el('span', {
          clase: `hu-punto hu-materia-${indiceColor(clase.materia, CANTIDAD_COLORES_MATERIA)}`,
          'aria-hidden': 'true',
        }),
        `${clase.hora_inicio} – ${clase.hora_fin}`,
      ),
      etiquetaEstado(clase),
    ),
    el(
      'div',
      { clase: 'd-flex gap-3 align-items-center flex-wrap p-3' },
      el(
        'div',
        { clase: 'flex-grow-1' },
        el('div', { clase: 'fw-semibold hu-clase__materia' }, clase.materia),
        clase.docente
          ? el('div', { clase: 'small text-secondary' }, icono('person'), ` ${clase.docente}`)
          : null,
      ),
      cancelada
        ? el('span', { clase: 'hu-sello' }, 'Cancelada')
        : el(
            'div',
            { clase: 'text-end' },
            el('div', { clase: 'hu-rotulo' }, 'Aula'),
            el('div', { clase: 'hu-carbon fs-5' }, clase.aula),
          ),
      el(
        'div',
        { clase: 'd-flex align-items-center gap-2 flex-wrap justify-content-end' },
        estado.confirmandoId === clase.id ? accionesConfirmacion(clase) : accionesNormales(clase),
      ),
    ),
  );
};

const renderizarDias = () => {
  const fragmento = document.createDocumentFragment();
  for (const dia of DIAS_VISIBLES) {
    const activo = dia === estado.dia;
    const conteo = estado.clases.filter((c) => c.dia_semana === dia).length;
    fragmento.append(
      el(
        'li',
        { clase: 'nav-item' },
        el(
          'button',
          {
            type: 'button',
            clase: `nav-link${activo ? ' active' : ''}`,
            'aria-pressed': String(activo),
            onclick: () => {
              estado.dia = dia;
              estado.confirmandoId = null;
              renderizar();
            },
          },
          DIAS[dia],
          conteo ? el('span', { clase: 'ms-2 small hu-contador' }, `(${conteo})`) : null,
        ),
      ),
    );
  }
  selectorDias.replaceChildren(fragmento);
};

const renderizarLista = () => {
  const delDia = estado.clases.filter((c) => c.dia_semana === estado.dia);
  if (!delDia.length) {
    lista.replaceChildren(
      el(
        'li',
        { clase: 'text-secondary py-4' },
        `No hay clases el ${DIAS[estado.dia].toLowerCase()}. Usa «Agregar clase» para empezar.`,
      ),
    );
    return;
  }
  lista.replaceChildren(...delDia.map(tarjetaClase));
};

const renderizar = () => {
  renderizarDias();
  renderizarLista();
};

export const cargarHorario = async (grupoId) => {
  estado.grupoId = grupoId;
  cerrarFormulario();
  lista.replaceChildren(
    el('li', { clase: 'text-secondary py-4', role: 'status' }, 'Cargando horario…'),
  );
  try {
    estado.clases = (await api.horario(grupoId)).clases;
    renderizar();
    alCambiarClases(estado.clases);
  } catch (error) {
    lista.replaceChildren();
    mostrarError(error);
  }
};

const recargar = async () => {
  estado.clases = (await api.horario(estado.grupoId)).clases;
  estado.confirmandoId = null;
  renderizar();
  alCambiarClases(estado.clases);
};

function abrirFormulario(clase = null) {
  estado.editandoId = clase?.id ?? null;
  formulario.reset();
  formulario.classList.remove('was-validated');
  tituloFormulario.textContent = clase ? 'Editar clase' : 'Agregar clase';
  camposSoloAlta.forEach((campo) => campo.classList.toggle('d-none', Boolean(clase)));
  camposSoloEdicion.forEach((campo) => campo.classList.toggle('d-none', !clase));

  formulario.elements.dia_semana.value = String(clase?.dia_semana ?? estado.dia);
  if (clase) {
    formulario.elements.materia.value = clase.materia;
    formulario.elements.hora_inicio.value = clase.hora_inicio;
    formulario.elements.hora_fin.value = clase.hora_fin;
    formulario.elements.aula.value = clase.aula;
    formulario.elements.estado.value = clase.estado;
  }
  contenedorFormulario.classList.remove('d-none');
  formulario.elements.materia.focus();
}

function cerrarFormulario() {
  estado.editandoId = null;
  contenedorFormulario.classList.add('d-none');
}

const valoresFormulario = () => {
  const f = formulario.elements;
  return {
    materia: f.materia.value.trim(),
    dia_semana: Number(f.dia_semana.value),
    hora_inicio: f.hora_inicio.value,
    hora_fin: f.hora_fin.value,
    aula: f.aula.value.trim(),
  };
};

const guardar = async (evento) => {
  evento.preventDefault();
  formulario.classList.add('was-validated');
  if (!formulario.checkValidity()) return;

  const boton = formulario.querySelector('[type="submit"]');
  boton.disabled = true;
  try {
    const valores = valoresFormulario();
    if (estado.editandoId) {
      await api.actualizarClase(estado.editandoId, {
        ...valores,
        estado: formulario.elements.estado.value,
      });
      mostrarMensaje('Clase actualizada.');
    } else {
      const docente = formulario.elements.docente.value.trim();
      await api.crearClase({ grupo_id: estado.grupoId, ...valores, ...(docente && { docente }) });
      mostrarMensaje('Clase agregada.');
    }
    estado.dia = valores.dia_semana;
    cerrarFormulario();
    await recargar();
  } catch (error) {
    mostrarError(error);
  } finally {
    boton.disabled = false;
  }
};

const cambiarEstado = async (clase, nuevoEstado) => {
  try {
    await api.actualizarClase(clase.id, { estado: nuevoEstado });
    mostrarMensaje(
      nuevoEstado === 'cancelada'
        ? `${clase.materia} quedó cancelada.`
        : `${clase.materia} se restableció.`,
    );
    await recargar();
  } catch (error) {
    mostrarError(error);
  }
};

const eliminar = async (clase) => {
  try {
    await api.eliminarClase(clase.id);
    mostrarMensaje(`${clase.materia} se eliminó del horario.`);
    await recargar();
  } catch (error) {
    mostrarError(error);
  }
};

export const iniciarHorario = () => {
  estado.dia = diaDeHoy();
  botonAgregar.addEventListener('click', () => abrirFormulario());
  document.getElementById('horario-cancelar').addEventListener('click', cerrarFormulario);
  formulario.addEventListener('submit', guardar);
};
