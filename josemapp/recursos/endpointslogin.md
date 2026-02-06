# Documentación Endpoints Login

## Base URL

```
https://tu-dominio-dolibarr.com/api/index.php
```

## Descripción General

Este endpoint permite obtener un token de autenticación (`DOLAPIKEY`) válido para consumir el resto de endpoints protegidos de la API de Dolibarr.

> ✅ A diferencia de lo que sugiere la advertencia del sistema, en este proyecto sí utilizamos este login ya que la aplicación se comunica directamente con la API y almacena el token de forma segura tras la autenticación.

---

## Endpoint de Login

### 1. Obtener Token (GET)

**GET** `/login`

**Parámetros Query**:

* `login` (requerido, `string`): Usuario.
* `password` (requerido, `string`): Contraseña.
* `entity` (opcional, `string`): Entidad, cuando se utiliza el módulo multicompañía. `''` implica la primera compañía.
* `reset` (opcional, `long`):

  * `0`: obtener token actual.
  * `1`: generar nuevo token (invalida el anterior).

**Ejemplo de petición**:

```
/login?login=tu_usuario&password=tu_contraseña
```

**Respuesta (200)**:

```json
{
  "success": {
    "code": 200,
    "token": "token_ejemplo_abc123",
    "entity": "1",
    "message": "Welcome - This is your token (recorded for your user). You can use it to make any REST API call."
  }
}
```

**Errores posibles**:

* `403`: Acceso denegado (credenciales incorrectas).
* `500`: Error interno del servidor.

---

## Uso del Token

Una vez recibido el token, debe almacenarse en `localStorage` o `sessionStorage` para su uso en llamadas futuras.

**Header requerido en cada petición autenticada:**

```http
DOLAPIKEY: token_ejemplo_abc123
```

## Recomendaciones

* No guardar nunca el login y la contraseña tras el login.
* Usar `HTTPS` para proteger la transmisión del token.
* El token es válido mientras no sea reseteado con `reset=1`.

---
