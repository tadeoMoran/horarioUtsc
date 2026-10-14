import { z } from 'zod';

const id = z.coerce.number().int().positive();
const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Usa el formato HH:MM');
const texto = (max) => z.string().trim().min(1).max(max);

export const esquemas = {
  paramsId: z.object({ id }),

  consultaGrupos: z.object({ carrera_id: id.optional() }),

  consultaHorario: z.object({ dia: z.coerce.number().int().min(1).max(7).optional() }),

  consultaLista: z.object({ limite: z.coerce.number().int().min(1).max(100).default(50) }),

  dispositivo: z.object({
    grupo_id: id,
    token_push: z.string().regex(/^Expo(nent)?PushToken\[[^\]]+\]$/, 'Token de Expo inválido'),
  }),

  login: z.object({
    correo: z.string().trim().toLowerCase().email().max(160),
    contrasena: z.string().min(1).max(200),
  }),

  claseNueva: z.object({
    grupo_id: id,
    materia: texto(120),
    docente: texto(120).optional(),
    dia_semana: z.number().int().min(1).max(7),
    hora_inicio: hora,
    hora_fin: hora,
    aula: texto(40),
  }),

  filaImportada: z.object({
    materia: texto(120),
    docente: texto(120).optional(),
    dia_semana: z.number().int().min(1).max(7),
    hora_inicio: hora,
    hora_fin: hora,
    aula: texto(40),
  }),

  importacion: z.object({
    grupo_id: id,
    solo_validar: z.boolean().default(false),
    filas: z
      .array(z.unknown())
      .min(1, 'El archivo no tiene clases')
      .max(300, 'Máximo 300 clases por archivo'),
  }),

  claseCambios: z
    .object({
      materia: texto(120),
      dia_semana: z.number().int().min(1).max(7),
      hora_inicio: hora,
      hora_fin: hora,
      aula: texto(40),
      estado: z.enum(['normal', 'aula_cambiada', 'cancelada']),
    })
    .partial()
    .refine((c) => Object.keys(c).length > 0, 'Indica al menos un campo a cambiar'),

  avisoNuevo: z.object({
    grupo_id: id,
    clase_id: id.optional(),
    tipo: z.enum(['cambio_aula', 'clase_cancelada', 'general']),
    mensaje: texto(500),
  }),
};
