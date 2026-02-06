import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Observable, of, map, catchError, tap } from 'rxjs';

interface UserPermissions {
  rowid: string;
  fk_user: string;
  fichajes: string;
  documentacion: string;
  consultas: string;
  gestion: string;
  active: string;
  user_name: string;
  user_login: string;
  user_email: string;
  id: string;
}

// Permisos por defecto para desarrollo/pruebas
const DEFAULT_PERMISSIONS: UserPermissions = {
  rowid: "1",
  fk_user: "1",
  fichajes: "3",
  documentacion: "0", // Por defecto sin acceso a documentación
  consultas: "3",
  gestion: "3",
  active: "1",
  user_name: "Usuario",
  user_login: "user",
  user_email: "",
  id: "1"
};

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {
  private cachedPermissions: UserPermissions | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) { }

  getUserPermissions(): Observable<UserPermissions> {
    // Si ya tenemos permisos en caché, los devolvemos
    if (this.cachedPermissions) {
      return of(this.cachedPermissions);
    }

    const currentUsername = this.authService.getUsername();
    
    // Si no hay usuario autenticado, devolvemos los permisos por defecto
    if (!currentUsername) {
      console.warn('No hay usuario autenticado, usando permisos por defecto');
      return of(DEFAULT_PERMISSIONS);
    }

    // Si no, los obtenemos de la API
    return this.apiService.get<UserPermissions[]>('/usuariosjosemaapi').pipe(
      map(users => {
        // Buscar el usuario por su login
        const userPermissions = users.find(user => 
          user.user_login.trim().toLowerCase() === currentUsername.toLowerCase()
        );
        
        if (userPermissions) {
          console.log(`Permisos encontrados para el usuario: ${currentUsername}`, userPermissions);
          return userPermissions;
        } else {
          console.warn(`Usuario ${currentUsername} no encontrado en la lista de permisos, usando permisos por defecto`);
          return DEFAULT_PERMISSIONS;
        }
      }),
      tap(permissions => {
        if (permissions) {
          this.cachedPermissions = permissions;
        }
      }),
      catchError(error => {
        console.error('Error al obtener permisos del usuario:', error);
        return of(DEFAULT_PERMISSIONS);
      })
    );
  }

  hasDocumentacionPermission(): Observable<boolean> {
    return this.getUserPermissions().pipe(
      map(permissions => permissions.documentacion === '3')
    );
  }

  // Para pruebas: cambia temporalmente el permiso de documentación
  setDocumentationPermissionForTesting(value: string): void {
    if (this.cachedPermissions) {
      this.cachedPermissions.documentacion = value;
    } else {
      this.cachedPermissions = {...DEFAULT_PERMISSIONS, documentacion: value};
    }
  }

  // Limpia la caché, útil para cuando el usuario cierra sesión
  clearPermissionsCache(): void {
    this.cachedPermissions = null;
  }
}
