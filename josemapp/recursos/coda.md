# Coda – Configuración de ejemplo

Todos los valores siguientes son **de ejemplo**. Sustitúyelos por los de tu documento Coda (token, ID de documento, IDs de tablas y columnas).

## Token y documento

- **Api token Coda**: `tu_token_coda_ejemplo_xxxxxxxx`
- **ID del documento**: `tu_doc_id_ejemplo`

## Tabla Facturas

- **idTable facturas**: `grid-XXXXXXXX`
- **idCol idFactura**: `c-XXXXXXXX`
- **idCol Empresa**: `c-XXXXXXXX`
- **idCol Productos**: `c-XXXXXXXX`
- **idCol Precio**: `c-XXXXXXXX`
- **idCol Fecha**: `c-XXXXXXXX`

## Tabla Productos

- **idTable Productos**: `grid-XXXXXXXX`
- **idCol idProducto**: `c-XXXXXXXX`
- **idCol Producto**: `c-XXXXXXXX`
- **idCol Precio**: `c-XXXXXXXX`

## Tabla Empresas

- **idTable Empresas**: `grid-XXXXXXXX`
- **idCol idEmpresa**: `c-XXXXXXXX`
- **idCol Empresa**: `c-XXXXXXXX`
- **idCol CIF**: `c-XXXXXXXX`

Los IDs reales se obtienen desde la API de Coda o desde la URL del documento/tabla en la interfaz de Coda. Configura estos valores en `bff/.env` (ver `bff/.env.example`).
