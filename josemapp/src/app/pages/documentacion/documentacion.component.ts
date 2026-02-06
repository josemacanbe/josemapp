import { Component, OnInit, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CodaService } from '../../services/coda.service';

interface Tarea {
  id?: string;
  tarea: string;
  estado: string;
  inicio: Date | string;
  duracion: number;
  responsable: string;
  dependeDe?: string;
}

@Component({
  selector: 'app-documentacion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './documentacion.component.html',
  styleUrl: './documentacion.component.css'
})
export class DocumentacionComponent implements OnInit {
  // Placeholders: los IDs reales de Coda deben vivir en el BFF (.env). Ver recursos/coda.md.
  private tablaTareas = 'grid-TAREAS-PLACEHOLDER';
  private colTarea = 'c-PLACEHOLDER-TAREA';
  private colEstado = 'c-PLACEHOLDER-ESTADO';
  private colInicio = 'c-PLACEHOLDER-INICIO';
  private colDuracion = 'c-PLACEHOLDER-DURACION';
  private colResponsable = 'c-PLACEHOLDER-RESPONSABLE';
  private colDependeDe = 'c-PLACEHOLDER-DEPENDE';

  // Variables del componente
  tareas: Tarea[] = [];
  tareaForm: FormGroup;
  tareaEditando: Tarea | null = null;
  mostrarModalTarea = false;
  mostrarModalConfirmacion = false;
  tareaSeleccionada: string | null = null;
  accionActual: 'crear' | 'editar' = 'crear';
  tareaDependiente: string | null = null;
  cargando = false;
  error = '';

  // Fechas de referencia para el diagrama de Gantt
  private fechaInicio = new Date('2025-04-15');
  private fechaFin = new Date('2025-05-25');
  private pixelesPorDia = 20;

  constructor(
    private codaService: CodaService,
    private fb: FormBuilder
  ) {
    this.tareaForm = this.fb.group({
      tarea: ['', Validators.required],
      estado: ['No iniciada', Validators.required],
      inicio: ['', Validators.required],
      duracion: [1, [Validators.required, Validators.min(1)]],
      responsable: ['', Validators.required],
      dependeDe: ['']
    });
    
    // Ajustar píxeles por día según el ancho de pantalla
    this.ajustarPixelesPorDia();
    
    // Escuchar cambios en el tamaño de la ventana
    window.addEventListener('resize', () => {
      this.ajustarPixelesPorDia();
    });
  }

  ngOnInit() {
    this.cargarTareas();
  }

  cargarTareas() {
    this.cargando = true;
    this.error = '';
    
    // Llamada real al servicio Coda
    this.codaService.getTareas(this.tablaTareas).subscribe(
      (data) => {
        this.tareas = data.map((item: any) => ({
          id: item.id,
          tarea: this.codaService.getValueByColumnId(item.values, this.colTarea) || '',
          estado: this.codaService.getValueByColumnId(item.values, this.colEstado) || '',
          inicio: this.codaService.getValueByColumnId(item.values, this.colInicio) || '',
          duracion: this.codaService.getValueByColumnId(item.values, this.colDuracion) || 1,
          responsable: this.codaService.getValueByColumnId(item.values, this.colResponsable) || '',
          dependeDe: this.codaService.getValueByColumnId(item.values, this.colDependeDe) || ''
        }));

        // Ordenar tareas por fecha de inicio
        this.tareas.sort((a, b) => {
          const fechaA = new Date(a.inicio).getTime();
          const fechaB = new Date(b.inicio).getTime();
          return fechaA - fechaB;
        });

        this.cargando = false;
      },
      (error) => {
        console.error('Error al cargar tareas:', error);
        this.error = 'Error al cargar las tareas. Por favor, intenta de nuevo.';
        this.cargando = false;
        
        // En caso de error, cargamos datos de ejemplo
        setTimeout(() => {
          this.tareas = [
            { id: '1', tarea: 'Análisis y definición del proyecto', estado: 'Hecho', inicio: '2025-04-16', duracion: 2, responsable: 'Usuario 1', dependeDe: '' },
            { id: '2', tarea: 'Maquetación inicial', estado: 'Hecho', inicio: '2025-04-18', duracion: 2, responsable: 'Usuario 1', dependeDe: '1' },
            { id: '3', tarea: 'Configuración de entorno', estado: 'Hecho', inicio: '2025-04-20', duracion: 1, responsable: 'Usuario 1', dependeDe: '2' },
            { id: '4', tarea: 'Desarrollo del Dashboard', estado: 'Hecho', inicio: '2025-04-21', duracion: 4, responsable: 'Usuario 1', dependeDe: '3' },
            { id: '5', tarea: 'CRUD Empresas y Productos', estado: 'Hecho', inicio: '2025-04-25', duracion: 3, responsable: 'Usuario 1', dependeDe: '4' },
            { id: '6', tarea: 'CRUD Facturas + gráfico', estado: 'Hecho', inicio: '2025-04-28', duracion: 3, responsable: 'Usuario 1', dependeDe: '5' },
            { id: '7', tarea: 'Desarrollo módulo Fichaje', estado: 'Hecho', inicio: '2025-05-01', duracion: 4, responsable: 'Usuario 1', dependeDe: '3' },
            { id: '8', tarea: 'Historial de Jornadas', estado: 'Hecho', inicio: '2025-05-05', duracion: 2, responsable: 'Usuario 1', dependeDe: '7' },
            { id: '9', tarea: 'Geolocalización fichajes', estado: 'Hecho', inicio: '2025-05-07', duracion: 1, responsable: 'Usuario 1', dependeDe: '7' },
            { id: '10', tarea: 'Chatbot IA', estado: 'Hecho', inicio: '2025-05-08', duracion: 2, responsable: 'Usuario 1', dependeDe: '3' },
            { id: '11', tarea: 'Sistema de permisos', estado: 'Hecho', inicio: '2025-05-10', duracion: 2, responsable: 'Usuario 1', dependeDe: '3' },
            { id: '12', tarea: 'Pruebas funcionales', estado: 'Hecho', inicio: '2025-05-12', duracion: 2, responsable: 'Usuario 1', dependeDe: '11' },
            { id: '13', tarea: 'Redacción documentación', estado: 'Hecho', inicio: '2025-05-14', duracion: 3, responsable: 'Usuario 1', dependeDe: '12' },
            { id: '14', tarea: 'Preparación despliegue', estado: 'Hecho', inicio: '2025-05-17', duracion: 2, responsable: 'Usuario 1', dependeDe: '13' },
            { id: '15', tarea: 'Finalización y entrega', estado: 'En proceso', inicio: '2025-05-20', duracion: 1, responsable: 'Usuario 1', dependeDe: '14' }
          ];

          // Ordenar tareas por fecha de inicio
          this.tareas.sort((a, b) => {
            const fechaA = new Date(a.inicio).getTime();
            const fechaB = new Date(b.inicio).getTime();
            return fechaA - fechaB;
          });
          
          this.cargando = false;
          this.error = '';
        }, 1000);
      }
    );
  }

  abrirModalNuevaTarea() {
    this.accionActual = 'crear';
    this.tareaForm.reset();
    this.tareaForm.patchValue({
      estado: 'No iniciada',
      duracion: 1
    });
    this.mostrarModalTarea = true;
  }

  abrirModalEditarTarea(tarea: Tarea) {
    this.accionActual = 'editar';
    this.tareaEditando = tarea;
    this.tareaForm.setValue({
      tarea: tarea.tarea,
      estado: tarea.estado,
      inicio: tarea.inicio,
      duracion: tarea.duracion,
      responsable: tarea.responsable,
      dependeDe: tarea.dependeDe || ''
    });
    this.mostrarModalTarea = true;
  }

  cerrarModalTarea() {
    this.mostrarModalTarea = false;
  }

  guardarTarea() {
    if (this.tareaForm.invalid) {
      return;
    }

    const tareaDatos = this.tareaForm.value;
    
    if (this.accionActual === 'crear') {
      const datosCoda = {
        rows: [
          {
            cells: [
              { column: this.colTarea, value: tareaDatos.tarea },
              { column: this.colEstado, value: tareaDatos.estado },
              { column: this.colInicio, value: tareaDatos.inicio },
              { column: this.colDuracion, value: tareaDatos.duracion },
              { column: this.colResponsable, value: tareaDatos.responsable },
              { column: this.colDependeDe, value: tareaDatos.dependeDe }
            ]
          }
        ]
      };
      
      this.codaService.crearFila(this.tablaTareas, datosCoda).subscribe(
        (response) => {
          this.cargarTareas();
          this.cerrarModalTarea();
        },
        (error) => {
          console.error('Error al crear tarea:', error);
          this.error = 'Error al crear la tarea. Por favor, intenta de nuevo.';
          
          // En caso de error, simular creación local
          const nuevaTarea: Tarea = {
            id: (this.tareas.length + 1).toString(),
            ...tareaDatos
          };
          
          this.tareas.push(nuevaTarea);
          this.cerrarModalTarea();
        }
      );
    } else if (this.accionActual === 'editar' && this.tareaEditando) {
      const datosCoda = {
        rows: [
          {
            cells: [
              { column: this.colTarea, value: tareaDatos.tarea },
              { column: this.colEstado, value: tareaDatos.estado },
              { column: this.colInicio, value: tareaDatos.inicio },
              { column: this.colDuracion, value: tareaDatos.duracion },
              { column: this.colResponsable, value: tareaDatos.responsable },
              { column: this.colDependeDe, value: tareaDatos.dependeDe }
            ]
          }
        ]
      };
      
      this.codaService.actualizarFila(this.tablaTareas, this.tareaEditando.id!, datosCoda).subscribe(
        (response) => {
          this.cargarTareas();
          this.cerrarModalTarea();
        },
        (error) => {
          console.error('Error al actualizar tarea:', error);
          this.error = 'Error al actualizar la tarea. Por favor, intenta de nuevo.';
          
          // En caso de error, simular actualización local
          const indice = this.tareas.findIndex(t => t.id === this.tareaEditando?.id);
          if (indice !== -1) {
            this.tareas[indice] = {
              ...this.tareas[indice],
              ...tareaDatos
            };
          }
          this.cerrarModalTarea();
        }
      );
    }
  }

  confirmarBorrarTarea(id: string) {
    this.tareaSeleccionada = id;
    this.mostrarModalConfirmacion = true;
  }

  borrarTarea() {
    if (!this.tareaSeleccionada) return;
    
    this.codaService.borrarFila(this.tablaTareas, this.tareaSeleccionada).subscribe(
      () => {
        this.cargarTareas();
        this.cerrarModalConfirmacion();
      },
      (error) => {
        console.error('Error al borrar tarea:', error);
        this.error = 'Error al borrar la tarea. Por favor, intenta de nuevo.';
        
        // En caso de error, simular borrado local
        this.tareas = this.tareas.filter(t => t.id !== this.tareaSeleccionada);
        this.cerrarModalConfirmacion();
      }
    );
  }

  cerrarModalConfirmacion() {
    this.mostrarModalConfirmacion = false;
    this.tareaSeleccionada = null;
  }

  getEstiloTarea(estado: string): string {
    switch (estado.toLowerCase()) {
      case 'hecho':
        return 'success';
      case 'en proceso':
        return 'info-bar';
      case 'no iniciada':
        return 'warning';
      default:
        return 'default';
    }
  }

  // Método para calcular la posición izquierda de la barra en el diagrama de Gantt
  calcularPosicionBarra(fechaInicio: string | Date): string {
    const fecha = new Date(fechaInicio);
    const diferenciaEnDias = Math.floor((fecha.getTime() - this.fechaInicio.getTime()) / (1000 * 60 * 60 * 24));
    return (diferenciaEnDias * this.pixelesPorDia) + 'px';
  }
  
  // Método para calcular el ancho de la barra en el diagrama de Gantt
  calcularAnchoBarra(duracion: number): string {
    return (duracion * this.pixelesPorDia) + 'px';
  }

  // Ajusta los píxeles por día según el ancho de la pantalla
  private ajustarPixelesPorDia(): void {
    const anchoVentana = window.innerWidth;
    
    if (anchoVentana > 1200) {
      this.pixelesPorDia = 20;
    } else if (anchoVentana > 1024) {
      this.pixelesPorDia = 18;
    } else if (anchoVentana > 768) {
      this.pixelesPorDia = 16;
    } else if (anchoVentana > 576) {
      this.pixelesPorDia = 15;
    } else {
      this.pixelesPorDia = 14;
    }
  }
}
