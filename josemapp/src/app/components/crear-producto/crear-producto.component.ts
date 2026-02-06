import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { CodaService } from '../../services/coda.service';

interface NuevoProducto {
  nombre: string;
  precio: number;
}

@Component({
  selector: 'app-crear-producto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-producto.component.html',
  styleUrls: ['./crear-producto.component.css']
})
export class CrearProductoComponent implements OnInit {
  @Input() visible: boolean = false;
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<NuevoProducto>();
  
  @ViewChild('productoForm') productoForm!: NgForm;
  
  nuevoProducto: NuevoProducto = this.resetProducto();
  
  constructor(private codaService: CodaService) { }
  
  ngOnInit(): void {
  }
  
  resetProducto(): NuevoProducto {
    return {
      nombre: '',
      precio: 0
    };
  }
  
  guardar(): void {
    if (this.productoForm.valid) {
      console.log('Guardando producto:', this.nuevoProducto);
      this.save.emit(this.nuevoProducto);
      this.visible = false;
      this.nuevoProducto = this.resetProducto();
    } else {
      console.log('Formulario inválido. Por favor, completa todos los campos requeridos.');
      // Marcar los campos como tocados para mostrar los errores
      Object.keys(this.productoForm.controls).forEach(key => {
        this.productoForm.controls[key].markAsTouched();
      });
    }
  }
  
  cancelar(): void {
    this.visible = false;
    this.nuevoProducto = this.resetProducto();
    this.close.emit();
  }
  
  closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancelar();
    }
  }
  
  formatearMoneda(valor: number): string {
    return valor.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  }
}
