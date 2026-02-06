# JoseM App

[![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node.js-20.19%2B-339933?logo=nodedotjs)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**JoseM App** es una aplicación web full-stack que unifica **control de fichajes**, **dashboard de facturación** y **asistente con IA** en una sola interfaz. Desarrollada como Trabajo Fin de Grado (TFG), integra APIs de **Dolibarr**, **Coda** y **DeepSeek** mediante un **BFF (Backend For Frontend)** en Node.js para mantener las credenciales en servidor y no exponerlas en el cliente.

---

## Índice

- [Descripción general](#-descripción-general)
- [Arquitectura](#-arquitectura)
- [Funcionalidades](#-funcionalidades)
- [Stack tecnológico](#-stack-tecnológico)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Rutas y seguridad](#-rutas-y-seguridad)
- [Servicios y flujo de datos](#-servicios-y-flujo-de-datos)
- [Requisitos previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Variables de entorno (BFF)](#-variables-de-entorno-bff)
- [Scripts NPM](#-scripts-npm)
- [Desarrollo y despliegue](#-desarrollo-y-despliegue)
- [Configuración de APIs externas](#-configuración-de-apis-externas)
- [Documentación técnica](#-documentación-técnica)
- [Autor y licencia](#-autor-y-licencia)

---

## 📋 Descripción general

JoseM App permite a un usuario:

1. **Iniciar sesión** con sus credenciales de Dolibarr (el token nunca llega al navegador; se gestiona en el BFF con cookie HttpOnly).
2. **Registrar fichajes** de entrada, pausa, regreso y salida, con historial de jornadas y estado actual.
3. **Consultar y gestionar** empresas, productos y facturas cuyos datos viven en un documento **Coda**; el frontend muestra un dashboard con gráficos (Chart.js) y modales para crear empresa, producto y factura.
4. **Chatear con un asistente** basado en **DeepSeek** para consultas sobre el uso de la aplicación (respuestas en Markdown).
5. **Acceder a documentación interna** (Markdown) con control de acceso por permisos (guards).

Todo el tráfico hacia Dolibarr, Coda y DeepSeek pasa por el **BFF**: el frontend solo conoce la URL del BFF (en desarrollo, vía proxy). Así se evita exponer API keys, tokens de Coda o el token Dolibarr en el cliente.

---

## 🏗 Arquitectura

```
+-----------------------------------------------------------------------+
|                        NAVEGADOR (Cliente)                            |
|  Angular SPA (localhost:4200 en dev / mismo origen en prod)           |
|  * Login, Dashboard, Fichajes, Consultas, Documentación               |
|  * Sin credenciales; solo envía datos de negocio al BFF               |
+-----------------------------------------------------------------------+
                    |
                    |  HTTP (withCredentials)  /bff/*
                    v
+-----------------------------------------------------------------------+
|              BFF - Backend For Frontend (Node/Express)                |
|              localhost:3001 (dev) / mismo puerto (prod)               |
|  * Sesión con cookie HttpOnly (token Dolibarr)                        |
|  * Proxy a Dolibarr, Coda y DeepSeek con credenciales desde .env      |
|  * En producción: sirve también los estáticos de Angular (SPA)        |
+-----------------------------------------------------------------------+
        |                     |                        |
        v                     v                        v
+---------------+    +---------------+    +-----------------------+
|   Dolibarr    |    |     Coda      |    |       DeepSeek        |
|  Login +      |    |  Empresas,    |    |  Chat completions     |
|  Fichajes     |    |  Productos,   |    |  (API key en BFF)     |
|  (API token   |    |  Facturas     |    |                       |
|   en sesión)  |    |  (token .env) |    |                       |
+---------------+    +---------------+    +-----------------------+
```

- **Desarrollo**: Angular en `:4200`, BFF en `:3001`; el proxy de Angular redirige `/bff` → `http://localhost:3001`.
- **Producción**: Un solo proceso (BFF) en el puerto configurado; sirve la SPA y las rutas `/bff/*`.

---

## ✨ Funcionalidades

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| **Login** | `/login` | Formulario usuario/contraseña; el BFF valida contra Dolibarr y crea sesión (cookie HttpOnly). No se expone token en el cliente. |
| **Dashboard** | `/dashboard` | Resumen de empresas, productos y facturas; gráfico de facturación por periodo (Chart.js); filtros por mes; modales para crear empresa, producto y factura; listas con búsqueda y detalle de factura. |
| **Fichajes** | `/fichaje` | Botones Entrada / Pausa / Regreso / Salida; estado actual de la jornada; historial de jornadas con paginación; observaciones opcionales. |
| **Consultas** | `/consultas` | Chat con IA (DeepSeek); historial de mensajes; respuestas renderizadas en Markdown (ngx-markdown); contexto de la aplicación. |
| **Documentación** | `/documentacion` | Contenido en Markdown; acceso restringido por permisos (DocumentacionGuard); vista de tareas/planificación (placeholders si no hay BFF de tareas). |
| **Acceso denegado** | `/acceso-denegado` | Página mostrada cuando el usuario no tiene permiso para documentación. |

Todas las rutas excepto `/login` están protegidas por **AuthGuard** (requiere sesión válida en el BFF). La ruta `/documentacion` además requiere permiso (DocumentacionGuard).

---

## 🛠 Stack tecnológico

| Capa | Tecnología |
|------|------------|
| **Frontend** | Angular 21, TypeScript 5.9, componentes standalone |
| **UI / gráficos** | ngx-bootstrap, Chart.js, CSS |
| **Contenido** | ngx-markdown, marked (Markdown) |
| **Estado y HTTP** | RxJS, HttpClient, withCredentials para cookies |
| **Backend (BFF)** | Node.js, Express, express-session, cors, dotenv |
| **APIs externas** | Dolibarr (login + fichajes), Coda (tablas/columnas), DeepSeek (chat) |

Versión de Node recomendada: **20.19+** LTS (en el proyecto se indica `>=20.19.0` en `engines` y opcionalmente `.nvmrc` con `22`).

---

## 📁 Estructura del proyecto

```
josemapp/
├── bff/                          # Backend For Frontend (Node/Express)
│   ├── src/
│   │   └── index.js              # Servidor Express: auth, proxy Dolibarr/Coda/DeepSeek, estáticos en prod
│   ├── .env.example               # Plantilla de variables de entorno (copiar a .env)
│   ├── .env                       # No versionado; credenciales y IDs Coda
│   └── package.json
├── src/
│   ├── app/
│   │   ├── components/           # Componentes reutilizables
│   │   │   ├── crear-empresa/     # Modal alta empresa
│   │   │   ├── crear-factura/     # Modal alta factura
│   │   │   ├── crear-producto/    # Modal alta producto
│   │   │   ├── detalle-factura/   # Modal detalle factura
│   │   │   ├── header/            # Cabecera de la app
│   │   │   ├── layout/            # Layout con sidebar para rutas autenticadas
│   │   │   ├── sidebar/           # Menú de navegación
│   │   │   └── sidebar-new/       # Variante del menú
│   │   ├── guards/
│   │   │   ├── auth.service.ts    # AuthGuard: comprueba sesión (localStorage username + BFF cookie)
│   │   │   └── documentacion.guard.ts  # DocumentacionGuard: comprueba permiso documentación
│   │   ├── pages/
│   │   │   ├── acceso-denegado/   # Página “sin permiso”
│   │   │   ├── consultas/         # Chat con IA
│   │   │   ├── dashboard/         # Dashboard empresas/productos/facturas y gráficos
│   │   │   ├── documentacion/     # Documentación interna (Markdown + tareas)
│   │   │   ├── error/             # Página de error genérica
│   │   │   ├── fichajes/          # Registro de jornadas
│   │   │   └── login/             # Inicio de sesión
│   │   ├── services/
│   │   │   ├── api.service.ts     # Cliente HTTP genérico (withCredentials) para /bff/*
│   │   │   ├── auth.service.ts    # Login/logout/estado; llama al BFF
│   │   │   ├── chatbot.service.ts # Envío de mensajes al BFF (DeepSeek)
│   │   │   ├── coda.service.ts    # Empresas, productos, facturas vía BFF (sin IDs en cliente)
│   │   │   ├── fichajes.service.ts# Fichajes y jornadas vía BFF (Dolibarr)
│   │   │   └── permissions.service.ts  # Permisos de usuario (documentación, etc.)
│   │   ├── app.component.*
│   │   ├── app.config.ts
│   │   └── app.routes.ts          # Definición de rutas y guards
│   ├── environments/
│   │   ├── environment.ts         # development (solo flags debug, sin secretos)
│   │   └── environment.prod.ts    # production
│   ├── assets/
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── public/                        # Assets estáticos (favicon, logo)
├── recursos/                      # Documentación de APIs (sin credenciales reales)
│   ├── auth.md
│   ├── coda.md
│   ├── endpointsfichajes.md
│   ├── endpointslogin.md
│   └── endpointsusuarios.md
├── .editorconfig
├── .gitignore
├── .nvmrc                         # Node 22 (opcional, para nvm)
├── angular.json
├── package.json
├── proxy.conf.json                # En dev: /bff → http://localhost:3001
├── tsconfig.json
└── README.md
```

- **Frontend**: no contiene URLs de Dolibarr/Coda/DeepSeek ni API keys; solo llama a rutas relativas `/bff/*`.
- **BFF**: lee todas las credenciales y IDs de tablas/columnas de Coda desde `bff/.env`.

---

## 🛣 Rutas y seguridad

| Ruta | Componente | Guard | Descripción |
|------|------------|--------|-------------|
| `/` | — | — | Redirección a `/login` |
| `/login` | LoginComponent | — | Página de inicio de sesión |
| `/dashboard` | DashboardComponent | AuthGuard | Dashboard principal |
| `/fichaje` | FichajesComponent | AuthGuard | Fichajes |
| `/consultas` | ConsultasComponent | AuthGuard | Chat con IA |
| `/documentacion` | DocumentacionComponent | AuthGuard + DocumentacionGuard | Documentación (acceso por permiso) |
| `/acceso-denegado` | AccesoDenegadoComponent | AuthGuard | Sin permiso para documentación |
| `**` | — | — | Redirección a `/login` |

- **AuthGuard**: comprueba que haya sesión (en la práctica, que el usuario esté “logueado” según el estado del frontend y que el BFF acepte la cookie). Si no, redirige a `/login`.
- **DocumentacionGuard**: comprueba permiso de documentación (p. ej. vía PermissionsService). Si no hay permiso, redirige a `/acceso-denegado`.

El **layout** (cabecera + sidebar) se aplica a todas las rutas hijas bajo el mismo `LayoutComponent`; la ruta `/login` no usa layout.

---

## 🔌 Servicios y flujo de datos

| Servicio | Responsabilidad | Origen de los datos |
|----------|-----------------|----------------------|
| **AuthService** | Login (POST `/bff/auth/login`), logout (POST `/bff/auth/logout`), estado de sesión y nombre de usuario en el cliente. | BFF → Dolibarr para login; sesión en BFF (cookie). |
| **ApiService** | Peticiones HTTP genéricas a rutas relativas (usado por FichajesService) con `withCredentials`. | BFF. |
| **FichajesService** | Estado de jornada, registro de entrada/pausa/regreso/salida, historial de jornadas. | BFF → Dolibarr (fichajes). |
| **CodaService** | Listado y alta de empresas, productos y facturas (payloads de negocio; sin IDs de Coda en el cliente). | BFF → Coda. |
| **ChatbotService** | Envío de mensajes al chat y recepción de respuestas. | BFF → DeepSeek. |
| **PermissionsService** | Permisos del usuario (p. ej. documentación). | BFF / Dolibarr (según implementación). |

El frontend **nunca** envía ni almacena el token Dolibarr ni el token de Coda; todo pasa por el BFF con cookie de sesión (y credenciales en `.env` en el servidor).

---

## 📋 Requisitos previos

- **Node.js** >= 20.19.0 (recomendado 22 o 24 LTS). Si usas [nvm](https://github.com/nvm-sh/nvm), en la raíz del proyecto hay `.nvmrc` con `22`; ejecuta `nvm use`.
- **npm** (incluido con Node).
- **Angular CLI** 21.x (opcional para comandos `ng` directos):  
  `npm install -g @angular/cli@21`

---

## 📦 Instalación

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/josemacanbe/josemapp.git
cd josemapp
npm install
```

### 2. Configurar el BFF (obligatorio)

Las credenciales y URLs se configuran solo en el BFF. No hace falta ningún `.env` en la raíz del frontend.

```bash
cd bff
cp .env.example .env
```

Edita `bff/.env` y rellena las variables (ver sección [Variables de entorno (BFF)](#-variables-de-entorno-bff)). No subas `bff/.env` a git (está en `.gitignore`).

```bash
cd ..
```

### 3. Arrancar en desarrollo

Un solo comando levanta el frontend y el BFF:

```bash
npm run dev
```

- **Frontend**: [http://localhost:4200](http://localhost:4200)  
- **BFF**: [http://localhost:3001](http://localhost:3001)  

El proxy de Angular redirige todas las peticiones a `/bff` hacia el BFF, por lo que la app funciona contra `localhost:4200`.

---

## 🔐 Variables de entorno (BFF)

Todas las variables se configuran en `bff/.env`. Plantilla: `bff/.env.example`.

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor BFF | `3001` |
| `SESSION_SECRET` | Secreto para firmar la sesión (cookie) | Cadena larga y aleatoria |
| `DOLIBARR_API_URL` | URL base de la API Dolibarr | `https://tu-dominio.com/api/index.php` |
| `DEEPSEEK_API_KEY` | API key de DeepSeek | `sk-...` |
| `DEEPSEEK_MODEL` | Modelo de chat | `deepseek-chat` |
| `CODA_API_TOKEN` | Token de API de Coda | (token de integración Coda) |
| `CODA_DOC_ID` | ID del documento Coda | (ID del doc en la URL de Coda) |
| `CODA_TABLE_EMPRESAS` | ID de la tabla de empresas | `grid-xxxxx` |
| `CODA_TABLE_PRODUCTOS` | ID de la tabla de productos | `grid-xxxxx` |
| `CODA_TABLE_FACTURAS` | ID de la tabla de facturas | `grid-xxxxx` |
| `CODA_COL_NOMBRE_EMPRESA` | ID de columna nombre (empresas) | `c-xxxxx` |
| `CODA_COL_CIF_EMPRESA` | ID de columna CIF (empresas) | `c-xxxxx` |
| `CODA_COL_NOMBRE_PRODUCTO` | ID de columna nombre (productos) | `c-xxxxx` |
| `CODA_COL_PRECIO_PRODUCTO` | ID de columna precio (productos) | `c-xxxxx` |
| `CODA_COL_EMPRESA_FACTURA` | ID de columna empresa (facturas) | `c-xxxxx` |
| `CODA_COL_FECHA_FACTURA` | ID de columna fecha (facturas) | `c-xxxxx` |
| `CODA_COL_PRODUCTOS_FACTURA` | ID de columna productos (facturas) | `c-xxxxx` |
| `CODA_COL_PRECIO_FACTURA` | ID de columna total (facturas) | `c-xxxxx` |

Los IDs de tablas y columnas de Coda se obtienen desde la API de Coda o desde la interfaz de Coda. En `recursos/coda.md` se explica la estructura esperada (con valores de ejemplo, sin datos reales).

---

## 📜 Scripts NPM

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Arranca en paralelo el frontend (Angular en :4200) y el BFF (Node en :3001). Uso habitual en desarrollo. |
| `npm run deploy` | Ejecuta `ng build` y luego inicia el BFF en modo producción; el BFF sirve la SPA y las rutas `/bff/*` en el mismo puerto. Una sola instancia para toda la app. |
| `npm start` | Solo Angular en desarrollo (con proxy a BFF). Útil si el BFF ya está levantado en otra terminal. |
| `npm run build` | Build de producción de Angular. Salida en `dist/josemapp/` (con subcarpeta `browser/`). |
| `npm run build:all` | Alias de `npm run build`. |
| `npm run start:prod` | Solo BFF en modo producción (`NODE_ENV=production`, `SERVING_STATIC=1`). Sirve estáticos desde `dist/josemapp/browser` si existen. |
| `npm run watch` | Build de Angular en modo watch (development). |
| `npm test` | Tests unitarios con Karma y Jasmine. |

---

## 🚀 Desarrollo y despliegue

### Desarrollo

1. Configura `bff/.env` como se indica arriba.
2. Desde la raíz: `npm run dev`.
3. Abre [http://localhost:4200](http://localhost:4200). El proxy enviará las peticiones `/bff` al BFF.

Si prefieres levantar solo el frontend (con el BFF ya en marcha en otra terminal):

```bash
npm start
```

Y en otra terminal, dentro de `bff/`:

```bash
npm run dev
```

### Despliegue (build + un solo servidor)

1. Build del frontend y arranque del BFF en modo producción:

```bash
npm run deploy
```

2. El BFF escuchará en el puerto definido en `bff/.env` (por defecto `3001`). En esa misma URL se sirve la SPA y las APIs bajo `/bff/*`.

3. En producción conviene usar un proxy inverso (nginx, etc.) con HTTPS y configurar la cookie de sesión como `secure` y, si aplica, `sameSite`.

---

## ⚙️ Configuración de APIs externas

- **Dolibarr**: El BFF usa `DOLIBARR_API_URL` para login y endpoints de fichajes. La autenticación se hace contra Dolibarr; el token se guarda en la sesión del BFF (cookie HttpOnly). Documentación de endpoints: `recursos/endpointslogin.md`, `recursos/auth.md`, `recursos/endpointsfichajes.md`.
- **Coda**: El BFF usa `CODA_*` para leer/escribir tablas de empresas, productos y facturas. El frontend solo envía datos de negocio (nombre, cif, empresa, fecha, productos, total). Documentación: `recursos/coda.md`.
- **DeepSeek**: El BFF usa `DEEPSEEK_API_KEY` y `DEEPSEEK_MODEL` para el chat. El frontend solo envía y recibe mensajes vía `/bff/deepseek/chat/completions`.

Ninguna de estas credenciales ni IDs de Coda están en el código del frontend; todo se centraliza en el BFF y en `bff/.env`.

---

## 📚 Documentación técnica

En la carpeta `recursos/` hay documentación de los endpoints y flujos (con ejemplos genéricos, sin credenciales reales):

- `auth.md` — Autenticación con Dolibarr y uso del token (y papel del BFF).
- `endpointslogin.md` — Endpoint de login de Dolibarr.
- `endpointsfichajes.md` — Endpoints de fichajes (entrada, salida, pausas).
- `endpointsusuarios.md` — Endpoints de usuarios y permisos.
- `coda.md` — Estructura esperada del documento Coda (tablas y columnas) y variables de entorno correspondientes.

---

## 👤 Autor y licencia

**José Manuel Cañadas Berga**

- GitHub: [@josemacanbe](https://github.com/josemacanbe)
- LinkedIn: [josemacanbe](https://www.linkedin.com/in/josemacanbe)

Este proyecto está bajo la **licencia MIT**. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 🙏 Agradecimientos

- [Angular](https://angular.io/)
- [Dolibarr](https://www.dolibarr.org/)
- [Coda](https://coda.io/)
- [DeepSeek](https://www.deepseek.com/)
