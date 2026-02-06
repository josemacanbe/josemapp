# JoseM App

### Full-Stack SaaS Platform · ERP Integration · AI Assistant · Secure BFF Architecture

![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Node](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs)
![License](https://img.shields.io/badge/License-MIT-green.svg)

Proyecto full-stack orientado a entorno empresarial que integra:

* Control horario laboral
* Facturación y gestión empresarial
* Integración ERP externa
* Asistente IA integrado en producto

Desarrollado como **Trabajo Fin de Grado (2024-2025, presentado mayo 2025)** y posteriormente evolucionado hacia arquitectura profesional con backend seguro tipo BFF.

---

## Demo del proyecto

Vídeo de presentación oficial:

[https://youtu.be/tQMWJmxM1z0](https://youtu.be/tQMWJmxM1z0)

El vídeo corresponde a la defensa académica; la versión actual incluye mejoras posteriores de arquitectura y seguridad.

---

## Vista general del producto

### Dashboard principal

```
/screenshots/dashboard.png
```

Incluye:

* métricas de facturación,
* gestión de empresas/productos/facturas,
* visualización analítica.

---

### Control horario laboral

```
/screenshots/time-tracking.png
```

Funcionalidades:

* fichaje completo (entrada, pausa, regreso, salida),
* historial laboral,
* sincronización ERP.

---

### Asistente IA integrado

```
/screenshots/ai-assistant.png
```

Permite:

* consultas internas,
* soporte contextual al usuario,
* interacción directa desde la app.

---

## Arquitectura técnica resumida

### Frontend

* Angular SPA moderna
* TypeScript
* Componentes standalone
* Dashboard interactivo

### Backend (BFF)

* Node.js + Express
* Gestión segura de sesiones
* Proxy a APIs externas
* Protección total de credenciales

### Integraciones externas

* Dolibarr ERP → autenticación y fichajes
* Coda API → datos empresariales
* DeepSeek API → asistente IA

Arquitectura pensada para entorno real, evitando exposición de tokens en cliente.

---

## Evolución tras el TFG

Después de la defensa:

* Implementación completa de Backend-for-Frontend
* Protección de credenciales y tokens
* Gestión segura de sesión HttpOnly
* Preparación para despliegue empresarial

El proyecto pasó de entorno académico a arquitectura profesional.

---

## Stack tecnológico

**Frontend**

* Angular 21
* TypeScript
* RxJS
* Chart.js
* Markdown rendering

**Backend**

* Node.js
* Express
* express-session
* dotenv

**Integraciones**

* Dolibarr API
* Coda API
* DeepSeek AI API

---

## Qué demuestra este proyecto

### Arquitectura

* Diseño SaaS completo
* Backend-for-Frontend aplicado correctamente
* Separación frontend/backend sólida

### Integración real

* APIs empresariales reales
* Autenticación externa
* Persistencia distribuida

### Seguridad

* Tokens nunca expuestos en cliente
* Variables sensibles solo en servidor
* Sesiones protegidas

### Producto funcional

* Flujos completos de usuario
* Dashboard operativo
* IA integrada como funcionalidad útil

---

## Documentación técnica completa

La documentación técnica detallada está en:

```
/josemapp/README.md
```

Incluye:

* instalación,
* estructura de proyecto,
* arquitectura completa,
* variables de entorno,
* endpoints.

---

## Contexto académico

* Trabajo Fin de Grado 2024-2025
* Presentado en mayo de 2025
* Proyecto mejor valorado de la promoción
* Posteriormente evolucionado a nivel profesional

---

## Autor

José Manuel Cañadas Berga

GitHub: [https://github.com/josemacanbe](https://github.com/josemacanbe)
LinkedIn: [https://www.linkedin.com/in/josemacanbe](https://www.linkedin.com/in/josemacanbe)