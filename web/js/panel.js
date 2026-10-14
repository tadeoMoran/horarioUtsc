import { api, sesion } from './api.js';
import { llenarClases, cargarAvisos, iniciarAvisos } from './avisos.js';
import { el } from './dom.js';
import { cargarHistorial } from './historial.js';
import { alActualizarClases, cargarHorario, iniciarHorario } from './horario.js';
import { iniciarImportacion, reiniciarImportacion } from './importar.js';
import { mostrarError } from './mensajes.js';

const selectorGrupo = document.getElementById('panel-grupo');
const nombreAdmin = document.getElementById('panel-admin');
const pestanaHistorial = document.getElementById('pestana-historial');

const etiquetaGrupo = (g) => `${g.cuatrimestre}° ${g.letra} · ${g.carrera}`;

const cargarGrupo = async (grupoId) => {
  await Promise.all([cargarHorario(grupoId), cargarAvisos(grupoId)]);
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
    selectorGrupo.replaceChildren(
      ...grupos.map((g) => el('option', { value: g.id }, etiquetaGrupo(g))),
    );
    selectorGrupo.addEventListener('change', () => {
      reiniciarImportacion();
      cargarGrupo(Number(selectorGrupo.value));
    });
    // El historial puede ser largo: solo se pide cuando se abre su pestaña.
    pestanaHistorial.addEventListener('shown.bs.tab', () =>
      cargarHistorial(Number(selectorGrupo.value)),
    );
    await cargarGrupo(grupos[0].id);
  } catch (error) {
    mostrarError(error);
  }
};

iniciar();
