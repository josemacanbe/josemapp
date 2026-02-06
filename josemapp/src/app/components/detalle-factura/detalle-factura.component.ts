import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DetalleProducto {
  id: string;
  nombre: string;
  precio: number;
}

interface FacturaDetallada {
  id: string;
  empresa: string;
  fecha: Date;
  productos: DetalleProducto[];
  total: number;
}

@Component({
  selector: 'app-detalle-factura',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-factura.component.html',
  styleUrls: ['./detalle-factura.component.css']
})
export class DetalleFacturaComponent implements OnInit {
  @Input() visible: boolean = false;
  @Input() factura: FacturaDetallada | null = null;
  
  @Output() close = new EventEmitter<void>();
  
  constructor() { }
  
  ngOnInit(): void {
  }
  
  cerrarModal(): void {
    this.visible = false;
    this.close.emit();
  }
  
  closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cerrarModal();
    }
  }
  
  formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-ES');
  }
  
  formatearMoneda(valor: number): string {
    return valor.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  }
}
