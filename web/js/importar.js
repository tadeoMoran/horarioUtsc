import { api } from './api.js';
import { DIAS } from './constantes.js';
import { filasDeCsv } from './csv.js';
import { el, icono } from './dom.js';
import { mostrarError, mostrarMensaje } from './mensajes.js';

const TAMANO_MAXIMO_BYTES = 200 * 1024;

const botonAbrir = document.getElementById('horario-importar');
const contenedor = document.getElementById('importar-contenedor');
const campoArchivo = document.getElementById('importar-archivo');
const resultado = document.getElementById('importar-resultado');
const botonConfirmar = document.getElementById('importar-confirmar');
const botonCancelar = document.getElementById('importar-cancelar');

let obtenerGrupoId = () => null;
let alImportar = () => {};
let filasValidas = [];

const limpiar = () => {
  filasValidas = [];
  campoArchivo.value = '';
  resultado.replaceChildren();
  botonConfirmar.disabled = true;
  botonConfirmar.textContent = 'Importar clases';
};

export const reiniciarImportacion = () => {
  limpiar();
  contenedor.classList.add('d-none');
};

const fila = (celdas, claseFila = '') =>
  el('tr', { clase: claseFila }, ...celdas.map((texto) => el('td', {}, texto)));

// Una fila por línea del archivo, en el mismo orden que verías en Excel.
const tablaPrevia = (filas, problemas) => {
  const porNumero = new Map(problemas.map((p) => [p.numero, p.mensaje]));
  const lineas = [
    ...filas.map((f) => ({ ...f, error: porNumero.get(f.numero) })),
    ...problemas
      .filter((p) => !filas.some((f) => f.numero === p.numero))
      .map((p) => ({ ...p, error: p.mensaje })),
  ].sort((a, b) => a.numero - b.numero);

  return el(
    'div',
    { clase: 'table-responsive hu-tabla-previa' },
    el(
      'table',
      { clase: 'table table-sm align-middle mb-0' },
      el(
        'thead',
        {},
        el(
          'tr',
          {},
          ...['Línea', 'Materia', 'Día', 'Horario', 'Aula', 'Revisión'].map((t) =>
            el('th', { scope: 'col' }, t),
          ),
        ),
      ),
      el(
        'tbody',
        {},
        ...lineas.map((l) =>
          l.materia
            ? fila(
                [
                  l.numero,
                  l.materia,
                  DIAS[l.dia_semana],
                  `${l.hora_inicio} – ${l.hora_fin}`,
                  l.aula,
                  l.error ? `Error: ${l.error}` : 'Lista',
                ],
                l.error ? 'table-danger' : '',
              )
            : fila([l.numero, '—', '—', '—', '—', `Error: ${l.error}`], 'table-danger'),
        ),
      ),
    ),
  );
};

const resumen = (filas, problemas) => {
  if (problemas.length === 0) {
    return el(
      'div',
      { clase: 'alert alert-success', role: 'status' },
      icono('check-circle'),
      ` ${filas.length} ${filas.length === 1 ? 'clase lista' : 'clases listas'} para importar.`,
    );
  }
  return el(
    'div',
    { clase: 'alert alert-warning', role: 'alert' },
    icono('exclamation-triangle'),
    ` ${problemas.length} ${problemas.length === 1 ? 'línea tiene' : 'líneas tienen'} problemas. No se importó nada: corrige el archivo y vuelve a subirlo.`,
  );
};

const revisar = async () => {
  // Se toma el archivo antes de limpiar: limpiar() vacía el campo y borraría la selección.
  const archivo = campoArchivo.files[0];
  filasValidas = [];
  resultado.replaceChildren();
  botonConfirmar.disabled = true;
  botonConfirmar.textContent = 'Importar clases';
  if (!archivo) return;
  if (archivo.size > TAMANO_MAXIMO_BYTES) {
    mostrarError(new Error('El archivo es demasiado grande (máximo 200 KB).'));
    return;
  }

  try {
    const { filas, errores } = filasDeCsv(await archivo.text());
    let problemas = [...errores];

    if (filas.length > 0) {
      const respuesta = await solicitarValidacion(filas);
      problemas = [
        ...problemas,
        ...respuesta.errores.map((e) => ({ numero: filas[e.indice].numero, mensaje: e.mensaje })),
      ];
    }

    filasValidas = problemas.length === 0 ? filas : [];
    resultado.replaceChildren(resumen(filas, problemas), tablaPrevia(filas, problemas));
    botonConfirmar.disabled = filasValidas.length === 0;
  } catch (error) {
    mostrarError(error);
  }
};

// La API responde 422 con la lista de errores: aquí es información, no un fallo.
const solicitarValidacion = async (filas) => {
  try {
    return await api.importarClases(obtenerGrupoId(), quitarNumeros(filas), true);
  } catch (error) {
    if (error.estado === 422 && error.cuerpo) return error.cuerpo;
    throw error;
  }
};

// La API no necesita el número de línea; solo sirve para mostrar errores.
const quitarNumeros = (filas) =>
  filas.map((f) => ({
    materia: f.materia,
    ...(f.docente && { docente: f.docente }),
    dia_semana: f.dia_semana,
    hora_inicio: f.hora_inicio,
    hora_fin: f.hora_fin,
    aula: f.aula,
  }));

const confirmar = async () => {
  botonConfirmar.disabled = true;
  botonConfirmar.textContent = 'Importando…';
  try {
    await api.importarClases(obtenerGrupoId(), quitarNumeros(filasValidas), false);
    mostrarMensaje(`${filasValidas.length} clases importadas.`);
    reiniciarImportacion();
    alImportar();
  } catch (error) {
    mostrarError(error);
    botonConfirmar.disabled = false;
    botonConfirmar.textContent = 'Importar clases';
  }
};

export const iniciarImportacion = (opciones) => {
  obtenerGrupoId = opciones.obtenerGrupoId;
  alImportar = opciones.alImportar;
  botonAbrir.addEventListener('click', () => {
    limpiar();
    contenedor.classList.toggle('d-none');
    if (!contenedor.classList.contains('d-none')) campoArchivo.focus();
  });
  botonCancelar.addEventListener('click', reiniciarImportacion);
  campoArchivo.addEventListener('change', revisar);
  botonConfirmar.addEventListener('click', confirmar);
};
