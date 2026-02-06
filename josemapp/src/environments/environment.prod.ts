export const environment = {
  production: true,
  // En este proyecto, los secretos viven en el BFF (Node), no en el frontend.
  debug: {
    enableTestMode: false,
    forceDocumentacionAccess: false
  }
};
