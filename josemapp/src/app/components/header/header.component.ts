import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  @Output() toggleMenu = new EventEmitter<void>();
  
  currentTime: string = '';
  greeting: string = '';
  username: string = '';

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.updateTime();
    
    // Actualizar la hora cada minuto
    interval(60000).subscribe(() => {
      this.updateTime();
    });
    
    // Obtener el nombre de usuario
    this.authService.username$.subscribe(name => {
      this.username = name || 'Técnico';
    });
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

  onToggleMenu(): void {
    this.toggleMenu.emit();
  }
}
