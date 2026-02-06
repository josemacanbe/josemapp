import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { CodaService } from '../../services/coda.service';

interface Empresa {
  id: string;
  nombre: string;
  cif: string;
}

interface Producto {
  id: string;
  nombre: string;
  precio: number;
}

interface NuevaFactura {
  empresa: string;
  fecha: string;
  productos: string[];
  total: number;
}

@Component({
  selector: 'app-crear-factura',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-factura.component.html',
  styleUrls: ['./crear-factura.component.css']
})
export class CrearFacturaComponent implements OnInit {
  @Input() visible: boolean = false;
  @Input() empresas: Empresa[] = [];
  @Input() productos: Producto[] = [];
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<NuevaFactura>();
  
  @ViewChild('facturaForm') facturaForm!: NgForm;
  
  nuevaFactura: NuevaFactura = this.resetFactura();
  selectedProducto: Producto | null = null;
  selectedProductos: Producto[] = [];
  
  constructor(private codaService: CodaService) { }
  
  ngOnInit(): void {
    // Inicializa la fecha con el día actual
    this.nuevaFactura.fecha = new Date().toISOString().split('T')[0];
  }
  
  resetFactura(): NuevaFactura {
    return {
      empresa: '',
      fecha: new Date().toISOString().split('T')[0],
      productos: [],
      total: 0
    };
  }
  
  addProducto(): void {
    if (this.selectedProducto) {
      // Verificamos que el producto no esté ya añadido
      if (!this.selectedProductos.some(p => p.id === this.selectedProducto!.id)) {
        this.selectedProductos.push(this.selectedProducto);
        // Actualizar el total
        this.nuevaFactura.total += this.selectedProducto.precio;
        // Agregar el ID del producto al array de productos
        this.nuevaFactura.productos.push(this.selectedProducto.id);
      }
      // Limpiar la selección
      this.selectedProducto = null;
    }
  }
  
  removeProducto(index: number): void {
    if (index >= 0 && index < this.selectedProductos.length) {
      // Restar el precio del producto eliminado
      const removedProducto = this.selectedProductos[index];
      this.nuevaFactura.total -= removedProducto.precio;
      
      // Eliminar el producto del array de seleccionados
      this.selectedProductos.splice(index, 1);
      this.nuevaFactura.productos.splice(index, 1);
    }
  }
  
  guardar(): void {
    if (this.facturaForm.valid) {
      console.log('Guardando factura:', this.nuevaFactura);
      this.save.emit(this.nuevaFactura);
      this.visible = false;
      this.nuevaFactura = this.resetFactura();
      this.selectedProductos = [];
    } else {
      console.log('Formulario inválido. Por favor, completa todos los campos requeridos.');
      // Marcar los campos como tocados para mostrar los errores
      Object.keys(this.facturaForm.controls).forEach(key => {
        this.facturaForm.controls[key].markAsTouched();
      });
    }
  }
  
  cancelar(): void {
    this.visible = false;
    this.nuevaFactura = this.resetFactura();
    this.selectedProductos = [];
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
