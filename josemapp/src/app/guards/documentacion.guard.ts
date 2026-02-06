import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, map, tap, of } from 'rxjs';
import { PermissionsService } from '../services/permissions.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DocumentacionGuard implements CanActivate {
  constructor(
    private permissionsService: PermissionsService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    // En modo de desarrollo, podemos forzar el acceso a documentación
    if (environment.debug?.forceDocumentacionAccess) {
      console.log('DEBUG: Permitiendo acceso a documentación en modo desarrollo');
      return of(true);
    }

    return this.permissionsService.hasDocumentacionPermission().pipe(
      tap(hasPermission => {
        if (!hasPermission) {
          console.log('Acceso denegado a documentación: el usuario no tiene permisos nivel 3');
          this.router.navigate(['/acceso-denegado']);
        }
      })
    );
  }
} 