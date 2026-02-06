import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { CodaService } from '../../services/coda.service';

interface NuevaEmpresa {
  nombre: string;
  cif: string;
}

@Component({
  selector: 'app-crear-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-empresa.component.html',
  styleUrls: ['./crear-empresa.component.css']
})
export class CrearEmpresaComponent implements OnInit {
  @Input() visible: boolean = false;
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<NuevaEmpresa>();
  
  @ViewChild('empresaForm') empresaForm!: NgForm;
  
  nuevaEmpresa: NuevaEmpresa = this.resetEmpresa();
  
  constructor(private codaService: CodaService) { }
  
  ngOnInit(): void {
  }
  
  resetEmpresa(): NuevaEmpresa {
    return {
      nombre: '',
      cif: ''
    };
  }
  
  guardar(): void {
    if (this.empresaForm.valid) {
      console.log('Guardando empresa:', this.nuevaEmpresa);
      this.save.emit(this.nuevaEmpresa);
      this.visible = false;
      this.nuevaEmpresa = this.resetEmpresa();
    } else {
      console.log('Formulario inválido. Por favor, completa todos los campos requeridos.');
      // Marcar los campos como tocados para mostrar los errores
      Object.keys(this.empresaForm.controls).forEach(key => {
        this.empresaForm.controls[key].markAsTouched();
      });
    }
  }
  
  cancelar(): void {
    this.visible = false;
    this.nuevaEmpresa = this.resetEmpresa();
    this.close.emit();
  }
  
  closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancelar();
    }
  }
}
