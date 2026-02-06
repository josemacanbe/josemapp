# Autenticación Dolibarr API

## Autenticación basada en Login dinámico

La aplicación Angular se conectará con la API de Dolibarr para iniciar sesión utilizando el login y contraseña del usuario. A cambio, Dolibarr devuelve un token (`DOLAPIKEY`) que se utilizará en las siguientes llamadas a los endpoints.

## Paso a paso de la autenticación

1. El usuario introduce su **login** y **contraseña** en el formulario de inicio de sesión.
2. Angular realiza una petición **GET** al endpoint `/login`.
3. La API responde con un objeto que incluye el `token`, `entity` y un mensaje de bienvenida.
4. En este proyecto el token se gestiona en el **BFF** (cookie HttpOnly); no se expone en el cliente. En implementaciones directas contra Dolibarr podría guardarse en `localStorage` o `sessionStorage` para el encabezado de cada petición.

## Ejemplo de petición

**GET** `/login?login=tu_usuario&password=tu_contraseña`

**Respuesta esperada:**

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

## Guardado del token (ejemplo sin BFF)

En una implementación que hable directo con Dolibarr:

```typescript
localStorage.setItem('DOLAPIKEY', response.success.token);
```

En este proyecto el token lo gestiona el BFF en sesión (cookie HttpOnly).

## Uso del token en futuras peticiones

Cada llamada a la API deberá incluir el token en el encabezado:

```http
DOLAPIKEY: token_ejemplo_abc123
```

## Archivo .env

En el `.env` solo se almacenará la **URL base**:

```env
# Ejemplo: URL base de tu instalación Dolibarr
DOLIBARR_API_URL=https://tu-dominio.com/api/index.php
```

## Recomendaciones de seguridad

* Nunca guardes el login y contraseña después de iniciar sesión.
* El token debe ser almacenado de forma segura (idealmente en `sessionStorage` si no se requiere persistencia).
* Siempre usar HTTPS.
* Implementar expiración de sesión si Dolibarr no lo gestiona por defecto.

## Interceptor Angular sugerido

Implementar un **HTTP Interceptor** que agregue automáticamente el token `DOLAPIKEY` a cada solicitud:

```typescript
intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  const token = localStorage.getItem('DOLAPIKEY');

  if (token) {
    const cloned = req.clone({
      setHeaders: { DOLAPIKEY: token }
    });
    return next.handle(cloned);
  }

  return next.handle(req);
}
```
