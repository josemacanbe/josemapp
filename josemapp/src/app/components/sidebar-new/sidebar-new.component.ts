import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PermissionsService } from '../../services/permissions.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments';

interface NavItem {
  path: string;
  icon: string;
  label: string;
  exact?: boolean;
  requiresPermission?: boolean;
  hasPermission?: boolean;
}

@Component({
  selector: 'app-sidebar-new',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar-new.component.html',
  styleUrl: './sidebar-new.component.css'
})
export class SidebarNewComponent implements OnInit {
  @Input() isMobileMenuOpen: boolean = false;
  @Output() toggleMenu = new EventEmitter<void>();

  navItems: NavItem[] = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard', exact: true },
    { path: '/fichaje', icon: '⏱️', label: 'Fichaje' },
    { 
      path: '/documentacion', 
      icon: '📄', 
      label: 'Documentación',
      requiresPermission: true,
      hasPermission: environment.debug?.forceDocumentacionAccess || false
    },
    { path: '/consultas', icon: '🔍', label: 'Consultas' }
  ];

  constructor(
    private permissionsService: PermissionsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Solo verificamos permisos si no estamos en modo desarrollo forzado
    if (!environment.debug?.forceDocumentacionAccess) {
      this.checkPermissions();
    }
  }

  private checkPermissions(): void {
    this.permissionsService.hasDocumentacionPermission().subscribe(hasPermission => {
      const docItem = this.navItems.find(item => item.path === '/documentacion');
      if (docItem) {
        docItem.hasPermission = hasPermission;
        console.log('Permiso de documentación actualizado:', hasPermission);
      }
    });
  }

  closeMobileMenu(): void {
    if (this.isMobileMenuOpen) {
      this.toggleMenu.emit();
    }
  }

  onToggleMenu(): void {
    this.toggleMenu.emit();
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/login';
  }
}
