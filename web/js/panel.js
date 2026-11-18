import { api, sesion } from './api.js';
import { llenarClases, cargarAvisos, iniciarAvisos } from './avisos.js';
import { el } from './dom.js';
import { cargarHistorial, iniciarHistorial, reiniciarHistorial } from './historial.js';
import { alActualizarClases, cargarHorario, iniciarHorario } from './horario.js';
import { iniciarImportacion, reiniciarImportacion } from './importar.js';
import { mostrarError } from './mensajes.js';

const selectorGrupo = document.getElementById('panel-grupo');
const nombreAdmin = document.getElementById('panel-admin');
const pestanaHistorial = document.getElementById('pestana-historial');

const selectorCarrera = document.getElementById('panel-carrera');

const etiquetaGrupo = (g) => `${g.cuatrimestre}° ${g.letra}`;

// Carreras en orden alfabético; dentro de cada una, grupos por cuatrimestre y letra.
const agruparPorCarrera = (grupos) => {
  const porCarrera = new Map();
  for (const g of grupos) {
    if (!porCarrera.has(g.carrera_id)) {
      porCarrera.set(g.carrera_id, { id: g.carrera_id, nombre: g.carrera, grupos: [] });
    }
    porCarrera.get(g.carrera_id).grupos.push(g);
  }
  for (const carrera of porCarrera.values()) {
    carrera.grupos.sort(
      (a, b) => a.cuatrimestre - b.cuatrimestre || a.letra.localeCompare(b.letra),
    );
  }
  return [...porCarrera.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
};

const llenarGrupos = (carreras, carreraId) => {
  const { grupos } = carreras.find((c) => c.id === carreraId);
  selectorGrupo.replaceChildren(
    ...grupos.map((g) => el('option', { value: g.id }, etiquetaGrupo(g))),
  );
};

const cargarGrupo = async (grupoId) => {
  // El historial se limpia al cambiar de grupo; si su pestaña está abierta, se vuelve a pedir.
  reiniciarHistorial();
  const tareas = [cargarHorario(grupoId), cargarAvisos(grupoId)];
  if (pestanaHistorial.classList.contains('active')) tareas.push(cargarHistorial(grupoId));
  await Promise.all(tareas);
};

const iniciar = async () => {
  const datos = sesion.obtener();
  if (!datos?.token) {
    window.location.replace('index.html');
    return;
  }
  nombreAdmin.textContent = datos.administrador.nombre;

  document.getElementById('panel-salir').addEventListener('click', () => {
    sesion.borrar();
    window.location.replace('index.html');
  });

  iniciarHorario();
  iniciarAvisos();
  iniciarHistorial();
  iniciarImportacion({
    obtenerGrupoId: () => Number(selectorGrupo.value),
    alImportar: () => cargarHorario(Number(selectorGrupo.value)),
  });
  alActualizarClases(llenarClases);

  try {
    const grupos = await api.misGrupos();
    if (!grupos.length) {
      mostrarError(
        new Error('Tu cuenta todavía no tiene grupos asignados. Pide que te asignen uno.'),
      );
      return;
    }
    const carreras = agruparPorCarrera(grupos);
    selectorCarrera.replaceChildren(
      ...carreras.map(({ id, nombre }) => el('option', { value: id }, nombre)),
    );
    selectorCarrera.value = String(grupos[0].carrera_id);
    llenarGrupos(carreras, Number(selectorCarrera.value));

    selectorCarrera.addEventListener('change', () => {
      llenarGrupos(carreras, Number(selectorCarrera.value));
      reiniciarImportacion();
      cargarGrupo(Number(selectorGrupo.value));
    });
    selectorGrupo.addEventListener('change', () => {
      reiniciarImportacion();
      cargarGrupo(Number(selectorGrupo.value));
    });
    // El historial puede ser largo: solo se pide cuando se abre su pestaña.
    pestanaHistorial.addEventListener('shown.bs.tab', () =>
      cargarHistorial(Number(selectorGrupo.value)),
    );
    await cargarGrupo(Number(selectorGrupo.value));
  } catch (error) {
    mostrarError(error);
  }
};

iniciar();
