import pg from 'pg';

// Adaptador mínimo: `query(texto, params)` y `transaction(fn)`. Los repositorios
// solo conocen esta interfaz, así las pruebas pueden usar otro motor.
export const crearDb = (connectionString) => {
  const pool = new pg.Pool({ connectionString, max: 5 });

  return {
    query: (texto, params) => pool.query(texto, params),
    transaction: async (fn) => {
      const cliente = await pool.connect();
      try {
        await cliente.query('BEGIN');
        const resultado = await fn({ query: (texto, params) => cliente.query(texto, params) });
        await cliente.query('COMMIT');
        return resultado;
      } catch (error) {
        await cliente.query('ROLLBACK');
        throw error;
      } finally {
        cliente.release();
      }
    },
    cerrar: () => pool.end(),
  };
};
