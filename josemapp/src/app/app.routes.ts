import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { FichajesComponent } from './pages/fichajes/fichajes.component';
import { ConsultasComponent } from './pages/consultas/consultas.component';
import { DocumentacionComponent } from './pages/documentacion/documentacion.component';
import { AccesoDenegadoComponent } from './pages/acceso-denegado/acceso-denegado.component';
import { AuthGuard } from './guards/auth.service';
import { DocumentacionGuard } from './guards/documentacion.guard';
import { LayoutComponent } from './components/layout/layout.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'fichaje', component: FichajesComponent },
      { path: 'consultas', component: ConsultasComponent },
      { 
        path: 'documentacion', 
        component: DocumentacionComponent,
        canActivate: [DocumentacionGuard]
      },
      { path: 'acceso-denegado', component: AccesoDenegadoComponent }
    ]
  },
  { path: '**', redirectTo: '/login' }
];
