const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Expo Go en Android no incluye el módulo nativo de suscripción a temas push, y
// `expo-notifications` lo pide al importarse. La app no usa temas, así que en Android se usa la
// versión vacía que el propio paquete trae para las demás plataformas.
const temasVacio = path.join(
  __dirname,
  'node_modules/expo-notifications/build/TopicSubscriptionModule.js',
);
const resolverPorDefecto = config.resolver.resolveRequest;

config.resolver.resolveRequest = (contexto, nombre, plataforma) => {
  if (
    plataforma === 'android' &&
    nombre === './TopicSubscriptionModule' &&
    contexto.originModulePath.includes(`expo-notifications${path.sep}`)
  ) {
    return { type: 'sourceFile', filePath: temasVacio };
  }
  return (resolverPorDefecto ?? contexto.resolveRequest)(contexto, nombre, plataforma);
};

module.exports = config;
