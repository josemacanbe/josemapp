# Documentación Endpoints Fichajes de Trabajadores

## Base URL

```
https://tu-dominio-dolibarr.com/api/index.php
```

## Autenticación

Todas las peticiones deben incluir el header:

```http
DOLAPIKEY: <token-devuelto-en-el-login>
```

Este token se obtiene al iniciar sesión mediante el endpoint `/login`. En este proyecto el BFF lo gestiona en sesión (cookie HttpOnly).

---

## Endpoints

### 1. Lista de todos los fichajes

**GET** `/fichajestrabajadoresapi/fichajes`

**Descripción**: Devuelve una lista de todos los fichajes registrados en el sistema.

---

### 2. Registrar una Entrada

**POST** `/fichajestrabajadoresapi/registrarEntrada`

**Descripción**: Registra un nuevo fichaje de entrada al sistema.

---

### 3. Registrar una Salida

**POST** `/fichajestrabajadoresapi/registrarSalida`

**Descripción**: Registra un fichaje de salida del sistema.

---

### 4. Iniciar una Pausa

**POST** `/fichajestrabajadoresapi/iniciarPausa`

**Descripción**: Registra el inicio de una pausa para el trabajador.

---

### 5. Terminar una Pausa

**POST** `/fichajestrabajadoresapi/terminarPausa`

**Cuerpo JSON esperado**:

```json
{
  "observaciones": "Observaciones opcionales",
  "latitud": 40.4168,
  "longitud": -3.7038
}
```

**Descripción**: Registra la finalización de una pausa en el sistema. Se pueden incluir observaciones y ubicación geográfica (opcional).

**Errores posibles**:

* `401`: No autorizado (token inválido o ausente).

---

## Consideraciones

* Todos los endpoints requieren autenticación mediante el token `DOLAPIKEY`.
* El token debe enviarse en el header de la petición.
* Usar HTTPS para proteger las credenciales y los tokens.

---
