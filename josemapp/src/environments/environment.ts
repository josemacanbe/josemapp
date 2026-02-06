export const environment = {
  production: false,
  // En este proyecto, los secretos viven en el BFF (Node), no en el frontend.
  debug: {
    enableTestMode: true,
    forceDocumentacionAccess: false
  }
};
