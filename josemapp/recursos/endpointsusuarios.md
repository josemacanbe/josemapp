# Documentación Endpoints Módulo Permisos Usuarios

## Base URL

```
https://tu-dominio-dolibarr.com/api/index.php
```

## Autenticación

Cada petición debe incluir el header:

```http
DOLAPIKEY: <token-devuelto-en-el-login>
```

Este token se obtiene al iniciar sesión con el endpoint `/login`. En este proyecto el BFF lo gestiona en sesión (cookie HttpOnly).

---

## Endpoints

### 1. Listar Usuarios

**GET** `/usuariosjosemaapi`

**Parámetros Query**:

* `limit` (opcional, tipo `long`): Limita el número de resultados.
* `page` (opcional, tipo `long`): Número de página.
* `sortfield` (opcional, tipo `string`): Campo para ordenar resultados. Ej: `u.rowid`.
* `sortorder` (opcional, tipo `string`): Orden de clasificación (`ASC` o `DESC`).

**Respuesta (200)**:

```json
[
  {
    "rowid": "1",
    "fk_user": "1",
    "fichajes": "3",
    "documentacion": "3",
    "consultas": "3",
    "gestion": "3",
    "active": "1",
    "date_creation": 1746445613,
    "tms": 1746452813,
    "fk_user_creat": "1",
    "fk_user_modif": null,
    "user_name": "UsuarioEjemplo",
    "user_login": "mi_usuario",
    "user_email": "",
    "id": "1"
  }
]
```

---

### 2. Obtener Usuarios por Permiso

**GET** `/usuariosjosemaapi/permissions/{module}/{level}`

**Parámetros Path**:

* `module` (requerido, tipo `string`): Nombre del módulo.
* `level` (requerido, tipo `long`): Nivel de permiso (0-3).

---

### 3. Crear Usuario

**POST** `/usuariosjosemaapi/usuariosjosemas`

**Cuerpo JSON**:

```json
{
  "request_data": ["datos del usuario"]
}
```

**Respuesta (200)**: Devuelve el ID del nuevo usuario creado.

---

### 4. Eliminar Usuario

**DELETE** `/usuariosjosemaapi/usuariosjosemas/{id}`

**Parámetros Path**:

* `id` (requerido, tipo `long`): ID del usuario a eliminar.

---

### 5. Obtener Propiedades de un Usuario

**GET** `/usuariosjosemaapi/usuariosjosemas/{id}`

**Parámetros Path**:

* `id` (requerido, tipo `long`): ID del usuario.

**Respuesta (200)**:

```json
{
  "rowid": "1",
  "fk_user": "1",
  "fichajes": "3",
  "documentacion": "3",
  "consultas": "3",
  "gestion": "3",
  "active": "1",
  "date_creation": 1746445613,
  "tms": 1746452813,
  "fk_user_creat": "1",
  "fk_user_modif": null,
  "user_name": "SuperAdmin",
  "user_login": "Tecnico",
  "user_email": "",
  "id": "1"
}
```

---

### 6. Actualizar Usuario

**PUT** `/usuariosjosemaapi/usuariosjosemas/{id}`

**Parámetros Path**:

* `id` (requerido, tipo `long`): ID del usuario a actualizar.

**Cuerpo JSON**:

```json
{
  "request_data": ["datos actualizados"]
}
```

**Respuesta (200)**: Devuelve ID del usuario actualizado.

---

## Manejo de errores

* `500`: Error interno (`RestException`).
* `401`: Token inválido o ausente (No autorizado).

---
