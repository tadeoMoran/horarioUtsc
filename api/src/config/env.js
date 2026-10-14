import { z } from 'zod';

const esquemaEntorno = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 caracteres'),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export const cargarConfig = (entorno = process.env) => {
  const resultado = esquemaEntorno.safeParse(entorno);
  if (!resultado.success) {
    const detalle = resultado.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`Configuración inválida:\n${detalle.join('\n')}`);
  }
  return resultado.data;
};
