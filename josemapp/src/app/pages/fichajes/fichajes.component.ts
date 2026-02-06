import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FichajesService, FichajeStatus, Jornada } from '../../services/fichajes.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-fichajes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './fichajes.component.html',
  styleUrl: './fichajes.component.css'
})
export class FichajesComponent implements OnInit, OnDestroy {
  status: FichajeStatus = 'noEntrada';
  currentJornada: Jornada | null = null;
  jornadas: Jornada[] = [];
  jornadasPaginadas: Jornada[] = [];
  username: string = '';
  currentTime: string = '';
  greeting: string = '';
  observaciones: string = '';
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  
  // Paginación
  itemsPorPagina: number = 4;
  paginaActual: number = 1;
  totalPaginas: number = 1;
  
  private statusSubscription: Subscription | null = null;
  private jornadasSubscription: Subscription | null = null;
  private currentJornadaSubscription: Subscription | null = null;
  private usernameSubscription: Subscription | null = null;
  private timerInterval: any = null;

  constructor(
    private fichajesService: FichajesService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Suscribirse a cambios en el nombre de usuario
    this.usernameSubscription = this.authService.username$.subscribe(username => {
      if (username) {
        this.username = username;
        this.fichajesService.actualizarUsuario(username);
      } else {
        this.username = 'Usuario';
      }
    });
    
    this.updateTime();
    // Actualizar la hora cada minuto
    this.timerInterval = setInterval(() => {
      this.updateTime();
    }, 60000);
    
    // Suscripciones
    this.statusSubscription = this.fichajesService.status$.subscribe(status => {
      this.status = status;
    });
    
    this.jornadasSubscription = this.fichajesService.jornadas$.subscribe(jornadas => {
      this.jornadas = jornadas;
      this.totalPaginas = Math.ceil(this.jornadas.length / this.itemsPorPagina);
      this.paginarJornadas();
    });
    
    this.currentJornadaSubscription = this.fichajesService.currentJornada$.subscribe(jornada => {
      this.currentJornada = jornada;
    });
    
    // Forzar carga desde API al iniciar
    this.recargarHistorial();
  }
  
  ngOnDestroy(): void {
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
    if (this.jornadasSubscription) {
      this.jornadasSubscription.unsubscribe();
    }
    if (this.currentJornadaSubscription) {
      this.currentJornadaSubscription.unsubscribe();
    }
    if (this.usernameSubscription) {
      this.usernameSubscription.unsubscribe();
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
  
  updateTime(): void {
    const now = new Date();
    
    // Formatear la hora como HH:MM
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    this.currentTime = `${hours}:${minutes}`;
    
    // Establecer el saludo según la hora
    const hour = now.getHours();
    
    if (hour >= 5 && hour < 12) {
      this.greeting = 'Buenos días';
    } else if (hour >= 12 && hour < 21) {
      this.greeting = 'Buenas tardes';
    } else {
      this.greeting = 'Buenas noches';
    }
  }
  
  // Paginación
  paginarJornadas(): void {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.jornadasPaginadas = this.jornadas.slice(inicio, fin);
  }
  
  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.paginarJornadas();
    }
  }
  
  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
      this.paginarJornadas();
    }
  }
  
  canShowButton(buttonType: 'entrada' | 'pausa' | 'regreso' | 'salida'): boolean {
    switch (buttonType) {
      case 'entrada':
        return this.status === 'noEntrada';
      case 'pausa':
        return this.status === 'trabajando';
      case 'regreso':
        return this.status === 'enPausa';
      case 'salida':
        return this.status === 'trabajando';
      default:
        return false;
    }
  }
  
  registrarEntrada(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    this.fichajesService.registrarEntrada(this.observaciones).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Entrada registrada correctamente';
        this.observaciones = '';
      },
      error: (error) => {
        console.error('Error al registrar entrada:', error);
        this.loading = false;
        this.errorMessage = 'Error al registrar entrada: ' + this.getErrorMessage(error);
      }
    });
  }
  
  iniciarPausa(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    this.fichajesService.iniciarPausa(this.observaciones).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Pausa iniciada correctamente';
        this.observaciones = '';
      },
      error: (error) => {
        console.error('Error al iniciar pausa:', error);
        this.loading = false;
        this.errorMessage = 'Error al iniciar pausa: ' + this.getErrorMessage(error);
      }
    });
  }
  
  terminarPausa(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    this.fichajesService.terminarPausa(this.observaciones).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Regreso registrado correctamente';
        this.observaciones = '';
      },
      error: (error) => {
        console.error('Error al terminar pausa:', error);
        this.loading = false;
        this.errorMessage = 'Error al terminar pausa: ' + this.getErrorMessage(error);
      }
    });
  }
  
  registrarSalida(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    this.fichajesService.registrarSalida(this.observaciones).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Salida registrada correctamente';
        this.observaciones = '';
      },
      error: (error) => {
        console.error('Error al registrar salida:', error);
        this.loading = false;
        this.errorMessage = 'Error al registrar salida: ' + this.getErrorMessage(error);
      }
    });
  }
  
  getButtonClass(buttonType: 'entrada' | 'pausa' | 'regreso' | 'salida'): string {
    const baseClass = 'fichaje-button';
    
    if (!this.canShowButton(buttonType)) {
      return `${baseClass} disabled`;
    }
    
    switch (buttonType) {
      case 'entrada':
        return `${baseClass} entrada-button`;
      case 'pausa':
        return `${baseClass} pausa-button`;
      case 'regreso':
        return `${baseClass} regreso-button`;
      case 'salida':
        return `${baseClass} salida-button`;
      default:
        return baseClass;
    }
  }
  
  private getErrorMessage(error: any): string {
    if (error.error && error.error.message) {
      return error.error.message;
    }
    if (typeof error.message === 'string') {
      return error.message;
    }
    return 'Error desconocido';
  }
  
  volver(): void {
    this.router.navigate(['/dashboard']);
  }
  
  // Método para recargar el historial desde la API
  recargarHistorial(): void {
    this.loading = true;
    this.errorMessage = '';
    this.fichajesService.recargarDatosDesdeAPI();
    
    // Simular tiempo de carga
    setTimeout(() => {
      this.loading = false;
    }, 1000);
  }

  formatearFecha(fecha: string): string {
    const [year, month, day] = fecha.split('-');
    return `${day}-${month}-${year}`;
  }
}
