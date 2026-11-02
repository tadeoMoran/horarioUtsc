import { idDeProyecto, idDeRespuesta, rutaDeNotificacion } from '../push';

describe('push remoto', () => {
  test('toma el projectId de app.json o de la configuración de EAS', () => {
    expect(idDeProyecto({ expoConfig: { extra: { eas: { projectId: 'abc' } } } })).toBe('abc');
    expect(idDeProyecto({ expoConfig: {}, easConfig: { projectId: 'xyz' } })).toBe('xyz');
  });

  test('sin projectId devuelve null en lugar de fallar', () => {
    expect(idDeProyecto({ expoConfig: {} })).toBeNull();
    expect(idDeProyecto(undefined)).toBeNull();
  });

  test('un aviso de clase abre el detalle de esa clase', () => {
    expect(rutaDeNotificacion({ clase_id: 12, tipo: 'cambio_aula' })).toBe('/clase/12');
    expect(rutaDeNotificacion({ clase_id: '7' })).toBe('/clase/7');
  });

  test('un aviso general, o con datos raros, abre Avisos', () => {
    expect(rutaDeNotificacion({ clase_id: null, tipo: 'general' })).toBe('/avisos');
    expect(rutaDeNotificacion({ clase_id: 'x' })).toBe('/avisos');
    expect(rutaDeNotificacion({ clase_id: -3 })).toBe('/avisos');
    expect(rutaDeNotificacion(undefined)).toBe('/avisos');
  });

  test('identifica la respuesta para no procesarla dos veces', () => {
    expect(idDeRespuesta({ notification: { request: { identifier: 'n1' } } })).toBe('n1');
    expect(idDeRespuesta(null)).toBeNull();
  });
});
