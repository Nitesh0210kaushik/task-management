const productionOrigin = globalThis.location.origin;

export const environment = {
  production: true,
  apiUrl: `${productionOrigin}/api`,
  socketUrl: productionOrigin
};
