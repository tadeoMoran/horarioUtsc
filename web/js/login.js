import { api, sesion } from './api.js';

const formulario = document.getElementById('login-formulario');
const botonEnviar = document.getElementById('login-enviar');
const cajaError = document.getElementById('login-error');

const mostrarError = (mensaje) => {
  cajaError.textContent = mensaje;
  cajaError.classList.remove('d-none');
};

const iniciarSesion = async (evento) => {
  evento.preventDefault();
  cajaError.classList.add('d-none');

  formulario.classList.add('was-validated');
  if (!formulario.checkValidity()) return;

  botonEnviar.disabled = true;
  botonEnviar.textContent = 'Entrando…';
  try {
    const datos = await api.iniciarSesion(
      formulario.elements.correo.value.trim(),
      formulario.elements.contrasena.value,
    );
    sesion.guardar(datos);
    window.location.replace('panel.html');
  } catch (error) {
    mostrarError(error.message);
    botonEnviar.disabled = false;
    botonEnviar.textContent = 'Iniciar sesión';
  }
};

if (sesion.obtener()?.token) window.location.replace('panel.html');
formulario.addEventListener('submit', iniciarSesion);
