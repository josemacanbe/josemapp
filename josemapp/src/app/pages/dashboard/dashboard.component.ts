import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CodaService } from '../../services/coda.service';
import { Subscription } from 'rxjs';
import { CrearFacturaComponent } from '../../components/crear-factura/crear-factura.component';
import { CrearEmpresaComponent } from '../../components/crear-empresa/crear-empresa.component';
import { CrearProductoComponent } from '../../components/crear-producto/crear-producto.component';
import Chart from 'chart.js/auto';
import { DetalleFacturaComponent } from '../../components/detalle-factura/detalle-factura.component';

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

interface Factura {
  id: string;
  empresa: string;
  productos: string[];
  total: number;
  fecha: Date;
}

interface NuevaFactura {
  empresa: string;
  fecha: string;
  productos: string[];
  total: number;
}

interface NuevaEmpresa {
  nombre: string;
  cif: string;
}

interface NuevoProducto {
  nombre: string;
  precio: number;
}

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
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    CrearFacturaComponent,
    CrearEmpresaComponent,
    CrearProductoComponent,
    DetalleFacturaComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  // Datos para los widgets
  numeroEmpresas: number = 0;
  numeroFacturas: number = 0;
  numeroProductos: number = 0;
  facturacionTotal: number = 0;
  
  // Datos para el gráfico
  mesSeleccionado: string = 'Último mes';
  chartFacturacion: any = null;

  // Datos para las listas
  empresas: Empresa[] = [];
  productos: Producto[] = [];
  ultimasFacturas: Factura[] = [];
  
  // Búsqueda
  busquedaEmpresa: string = '';
  busquedaProducto: string = '';
  empresasFiltradas: Empresa[] = [];
  productosFiltrados: Producto[] = [];
  
  // Modales
  mostrarModalCrearFactura: boolean = false;
  mostrarModalCrearEmpresa: boolean = false;
  mostrarModalCrearProducto: boolean = false;
  mostrarModalDetalleFactura: boolean = false;
  facturaSeleccionada: FacturaDetallada | null = null;
  
  // Subscripciones
  private subscriptions: Subscription[] = [];
  
  constructor(
    private authService: AuthService,
    private codaService: CodaService,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Corrección para el problema de scroll
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    
    this.cargarDatosEmpresas();
    this.cargarDatosProductos();
    this.cargarDatosFacturas();
  }
  
  ngAfterViewInit(): void {
    // Forzar que el scroll funcione
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    
    setTimeout(() => {
      this.inicializarGraficoFacturacion();
    }, 500);
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  cargarDatosEmpresas(): void {
    const sub = this.codaService.getEmpresas().subscribe({
      next: (data) => {
        console.log('Datos de empresas recibidos:', data);
        
        // Usamos directamente los datos procesados por el servicio
        if (Array.isArray(data)) {
          this.empresas = data;
          this.empresasFiltradas = [...this.empresas];
          this.numeroEmpresas = this.empresas.length;
          console.log('Empresas cargadas:', this.empresas);
        } else {
          console.error('Los datos de empresas recibidos no son un array:', data);
          this.empresas = [];
          this.empresasFiltradas = [];
          this.numeroEmpresas = 0;
        }
      },
      error: (error) => {
        console.error('Error al cargar empresas:', error);
      }
    });
    this.subscriptions.push(sub);
  }
  
  cargarDatosProductos(): void {
    const sub = this.codaService.getProductos().subscribe({
      next: (data) => {
        console.log('Datos de productos recibidos:', data);
        
        // Usamos directamente los datos procesados por el servicio
        if (Array.isArray(data)) {
          this.productos = data;
          this.productosFiltrados = [...this.productos];
          this.numeroProductos = this.productos.length;
          console.log('Productos cargados:', this.productos);
        } else {
          console.error('Los datos de productos recibidos no son un array:', data);
          this.productos = [];
          this.productosFiltrados = [];
          this.numeroProductos = 0;
        }
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
      }
    });
    this.subscriptions.push(sub);
  }
  
  cargarDatosFacturas(): void {
    const sub = this.codaService.getFacturas().subscribe({
      next: (data) => {
        console.log('Datos de facturas recibidos:', data);
        
        // Usamos directamente los datos procesados por el servicio
        if (Array.isArray(data)) {
          this.ultimasFacturas = data;
          
          // Ordenar por fecha más reciente
          this.ultimasFacturas.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
          
          // Calcular la facturación total
          this.facturacionTotal = this.ultimasFacturas.reduce((sum, factura) => sum + factura.total, 0);
          
          // Actualizar número de facturas
          this.numeroFacturas = this.ultimasFacturas.length;
          
          console.log('Facturas cargadas:', this.ultimasFacturas);
          
          // Actualizar el gráfico si ya está creado
          if (this.chartFacturacion) {
            this.actualizarDatosGrafico();
          }
        } else {
          console.error('Los datos de facturas recibidos no son un array:', data);
          this.ultimasFacturas = [];
          this.numeroFacturas = 0;
          this.facturacionTotal = 0;
        }
      },
      error: (error) => {
        console.error('Error al cargar facturas:', error);
      }
    });
    this.subscriptions.push(sub);
  }
  
  // Convierte el array de celdas en un objeto para acceso más fácil
  // Este método ya no se utiliza porque el servicio ya procesa los datos correctamente
  convertirCellsAMapa(cells: any[]): any {
    const mapa: any = {};
    
    console.log('Procesando celdas:', cells);
    
    if (!cells) {
      console.warn('No hay celdas para procesar');
      return mapa;
    }
    
    // Si cells no es un array, pero es un objeto, intentamos extraer valores
    if (!Array.isArray(cells) && typeof cells === 'object') {
      console.log('cells no es un array, es un objeto:', cells);
      
      // Intentamos extraer datos de propiedades conocidas
      Object.keys(cells).forEach(key => {
        if (cells[key] !== undefined) {
          mapa[key] = cells[key];
        }
      });
      
      return mapa;
    }
    
    // Procesamiento normal si cells es un array
    if (Array.isArray(cells)) {
      cells.forEach(cell => {
        try {
          // Caso 1: La celda tiene propiedades column y value
          if (cell && cell.column && cell.value !== undefined) {
            mapa[cell.column] = cell.value;
          } 
          // Caso 2: La celda tiene propiedades columnId y value
          else if (cell && cell.columnId && cell.value !== undefined) {
            mapa[cell.columnId] = cell.value;
          }
          // Caso 3: La celda es un objeto con otras propiedades
          else if (cell && typeof cell === 'object') {
            Object.keys(cell).forEach(key => {
              // Evitamos keys como id, type, etc.
              if (key !== 'id' && key !== 'type' && key !== 'index' && cell[key] !== undefined) {
                mapa[key] = cell[key];
                
                // Si la propiedad es un objeto con una estructura específica
                if (typeof cell[key] === 'object' && cell[key] !== null) {
                  // Intentamos extraer valor de propiedades comunes en APIs
                  if (cell[key].value !== undefined) {
                    mapa[key] = cell[key].value;
                  }
                }
              }
            });
          }
        } catch (e) {
          console.error('Error al procesar celda:', cell, e);
        }
      });
    }
    
    console.log('Mapa resultante:', mapa);
    return mapa;
  }
  
  inicializarGraficoFacturacion(): void {
    try {
      const canvas = document.getElementById('graficoFacturacion') as HTMLCanvasElement;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      this.chartFacturacion = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Facturación',
            data: [],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                // Formatear los valores como moneda
                callback: function(value) {
                  return value + ' €';
                }
              }
            },
            x: {
              ticks: {
                maxRotation: 45,
                minRotation: 45
              }
            }
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                boxWidth: 12,
                padding: 10
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    label += new Intl.NumberFormat('es-ES', { 
                      style: 'currency', 
                      currency: 'EUR'
                    }).format(context.parsed.y);
                  }
                  return label;
                }
              }
            }
          }
        }
      });
      
      this.actualizarDatosGrafico();
    } catch (error) {
      console.error('Error al inicializar el gráfico:', error);
    }
  }
  
  actualizarDatosGrafico(): void {
    if (!this.chartFacturacion || !this.ultimasFacturas.length) return;
    
    try {
      // Filtrar facturas según el mes seleccionado
      const hoy = new Date();
      let fechaInicio = new Date();
      
      switch (this.mesSeleccionado) {
        case 'Último mes':
          fechaInicio.setMonth(hoy.getMonth() - 1);
          break;
        case 'Últimos 3 meses':
          fechaInicio.setMonth(hoy.getMonth() - 3);
          break;
        case 'Últimos 6 meses':
          fechaInicio.setMonth(hoy.getMonth() - 6);
          break;
        case 'Todo el año':
          fechaInicio.setMonth(0);
          fechaInicio.setDate(1);
          break;
      }
      
      const facturasFiltradas = this.ultimasFacturas.filter(factura => 
        factura.fecha >= fechaInicio && factura.fecha <= hoy
      );
      
      // Agrupar facturas por día
      const facturasPorDia = new Map<string, number>();
      
      facturasFiltradas.forEach(factura => {
        const fecha = factura.fecha;
        const fechaKey = `${fecha.getDate().toString().padStart(2, '0')}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (facturasPorDia.has(fechaKey)) {
          const valorActual = facturasPorDia.get(fechaKey);
          if (valorActual !== undefined) {
            facturasPorDia.set(fechaKey, valorActual + factura.total);
          }
        } else {
          facturasPorDia.set(fechaKey, factura.total);
        }
      });
      
      // Convertir a arrays para el gráfico (ordenado por fecha ascendente)
      const fechas = Array.from(facturasPorDia.keys()).sort((a, b) => {
        const [diaA, mesA] = a.split('-').map(Number);
        const [diaB, mesB] = b.split('-').map(Number);
        
        if (mesA !== mesB) return mesA - mesB;
        return diaA - diaB;
      });
      
      const valores = fechas.map(fecha => {
        const valor = facturasPorDia.get(fecha);
        return valor !== undefined ? valor : 0;
      });
      
      // Actualizar el gráfico
      this.chartFacturacion.data.labels = fechas;
      this.chartFacturacion.data.datasets[0].data = valores;
      this.chartFacturacion.update();
    } catch (error) {
      console.error('Error al actualizar el gráfico:', error);
    }
  }
  
  cambiarMesSeleccionado(event: any): void {
    this.mesSeleccionado = event.target.value;
    this.actualizarDatosGrafico();
  }
  
  // Métodos para el modal de crear facturas
  abrirModalCrearFactura(): void {
    this.mostrarModalCrearFactura = true;
  }
  
  cerrarModalCrearFactura(): void {
    this.mostrarModalCrearFactura = false;
  }
  
  guardarNuevaFactura(factura: NuevaFactura): void {
    this.codaService.crearFactura({
      empresa: factura.empresa,
      fecha: factura.fecha,
      productos: factura.productos,
      total: factura.total
    }).subscribe({
      next: (response) => {
        console.log('Factura creada exitosamente', response);
        // Recargar los datos de facturas para reflejar el cambio
        this.cargarDatosFacturas();
        this.cerrarModalCrearFactura();
      },
      error: (error) => {
        console.error('Error al crear factura:', error);
        alert('Error al crear la factura. Por favor, intenta nuevamente.');
      }
    });
  }
  
  // Métodos para el modal de crear empresas
  abrirModalCrearEmpresa(): void {
    this.mostrarModalCrearEmpresa = true;
  }
  
  cerrarModalCrearEmpresa(): void {
    this.mostrarModalCrearEmpresa = false;
  }
  
  guardarNuevaEmpresa(empresa: NuevaEmpresa): void {
    this.codaService.crearEmpresa({ nombre: empresa.nombre, cif: empresa.cif }).subscribe({
      next: (response) => {
        console.log('Empresa creada exitosamente', response);
        // Recargar los datos de empresas para reflejar el cambio
        this.cargarDatosEmpresas();
        this.cerrarModalCrearEmpresa();
      },
      error: (error) => {
        console.error('Error al crear empresa:', error);
        alert('Error al crear la empresa. Por favor, intenta nuevamente.');
      }
    });
  }
  
  // Métodos para el modal de crear productos
  abrirModalCrearProducto(): void {
    this.mostrarModalCrearProducto = true;
  }
  
  cerrarModalCrearProducto(): void {
    this.mostrarModalCrearProducto = false;
  }
  
  guardarNuevoProducto(producto: NuevoProducto): void {
    this.codaService.crearProducto({ nombre: producto.nombre, precio: producto.precio }).subscribe({
      next: (response) => {
        console.log('Producto creado exitosamente', response);
        // Recargar los datos de productos para reflejar el cambio
        this.cargarDatosProductos();
        this.cerrarModalCrearProducto();
      },
      error: (error) => {
        console.error('Error al crear producto:', error);
        alert('Error al crear el producto. Por favor, intenta nuevamente.');
      }
    });
  }
  
  formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-ES');
  }
  
  formatearMoneda(valor: number): string {
    return valor.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  }
  
  // Métodos para búsqueda 
  filtrarEmpresas(evento: Event): void {
    const termino = (evento.target as HTMLInputElement).value.toLowerCase().trim();
    this.busquedaEmpresa = termino;
    
    if (!termino) {
      this.empresasFiltradas = [...this.empresas];
    } else {
      this.empresasFiltradas = this.empresas.filter(empresa => 
        empresa.nombre.toLowerCase().includes(termino) || 
        empresa.cif.toLowerCase().includes(termino)
      );
    }
  }
  
  filtrarProductos(evento: Event): void {
    const termino = (evento.target as HTMLInputElement).value.toLowerCase().trim();
    this.busquedaProducto = termino;
    
    if (!termino) {
      this.productosFiltrados = [...this.productos];
    } else {
      this.productosFiltrados = this.productos.filter(producto => 
        producto.nombre.toLowerCase().includes(termino) || 
        producto.precio.toString().includes(termino)
      );
    }
  }
  
  // Métodos para mostrar detalles de factura
  mostrarDetallesFactura(factura: Factura): void {
    console.log('Mostrando detalles de factura:', factura);
    
    // Crear objeto de factura detallada solo con los datos básicos
    this.facturaSeleccionada = {
      id: factura.id, 
      empresa: factura.empresa,
      fecha: factura.fecha,
      productos: [], // Ya no necesitamos productos
      total: factura.total
    };
    
    // Mostrar el modal inmediatamente con la información básica
    this.mostrarModalDetalleFactura = true;
  }
  
  cerrarModalDetalleFactura(): void {
    this.mostrarModalDetalleFactura = false;
    this.facturaSeleccionada = null;
  }
}
