import { el, icono } from './dom.js';

const contenedor = () => document.getElementById('panel-mensajes');

// Los errores se quedan hasta que se cierran; los éxitos desaparecen solos.
export const mostrarMensaje = (texto, tipo = 'success') => {
  const alerta = el(
    'div',
    {
      clase: `alert alert-${tipo} alert-dismissible fade show`,
      role: tipo === 'danger' ? 'alert' : 'status',
    },
    icono(tipo === 'danger' ? 'exclamation-triangle' : 'check-circle'),
    ' ',
    texto,
    el('button', {
      type: 'button',
      clase: 'btn-close',
      'data-bs-dismiss': 'alert',
      'aria-label': 'Cerrar mensaje',
    }),
  );
  contenedor().replaceChildren(alerta);
  if (tipo !== 'danger') setTimeout(() => alerta.remove(), 6000);
};

export const mostrarError = (error) => {
  const detalle = (error.detalle ?? []).map((d) => `${d.campo}: ${d.mensaje}`).join(' · ');
  mostrarMensaje(detalle ? `${error.message} (${detalle})` : error.message, 'danger');
};
