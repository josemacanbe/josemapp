import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CodaService {
  /**
   * IMPORTANTE:
   * Para no exponer secretos en el cliente, el acceso a Coda debe hacerse desde el BFF.
   * Este servicio consume `/bff/coda/*`; los IDs de tablas/columnas y el token viven en el BFF (.env).
   * El frontend solo envía datos de negocio (nombre, cif, empresa, fecha, etc.).
   */

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    // Ya no se usa (se deja por compatibilidad con código existente).
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  // Métodos para obtener datos de las tablas de Coda
  getEmpresas(): Observable<any> {
    return this.http.get('/bff/coda/empresas', { withCredentials: true });
  }

  getProductos(): Observable<any> {
    return this.http.get('/bff/coda/productos', { withCredentials: true });
  }

  getFacturas(): Observable<any> {
    return this.http.get('/bff/coda/facturas', { withCredentials: true });
  }
  
  // Método auxiliar para extraer valor por ID de columna
  public getValueByColumnId(values: any, columnId: string): any {
    if (!values) return null;
    
    // Si values es un objeto con propiedades directas
    if (values[columnId] !== undefined) {
      return values[columnId];
    }
    
    // Si values es un array de objetos
    if (Array.isArray(values)) {
      for (const val of values) {
        if (val.column && val.column.id === columnId) {
          return val.value;
        }
        if (val.columnId === columnId) {
          return val.value;
        }
      }
    }
    
    return null;
  }

  /** Crea una factura. Payload: { empresa, fecha, productos, total }. Los IDs de Coda los resuelve el BFF. */
  crearFactura(payload: { empresa: string; fecha: string; productos: string[]; total: number }): Observable<any> {
    return this.http.post('/bff/coda/facturas', payload, { withCredentials: true });
  }

  /** Crea una empresa. Payload: { nombre, cif }. Los IDs de Coda los resuelve el BFF. */
  crearEmpresa(payload: { nombre: string; cif: string }): Observable<any> {
    return this.http.post('/bff/coda/empresas', payload, { withCredentials: true });
  }

  /** Crea un producto. Payload: { nombre, precio }. Los IDs de Coda los resuelve el BFF. */
  crearProducto(payload: { nombre: string; precio: number }): Observable<any> {
    return this.http.post('/bff/coda/productos', payload, { withCredentials: true });
  }

  // Método para obtener los productos detallados de una factura
  getProductosDeFactura(facturaId: string): Observable<any> {
    // En modo BFF, esta funcionalidad debería implementarse en servidor.
    // Devolvemos un array vacío para no romper la UI si alguien la llama accidentalmente.
    console.warn('getProductosDeFactura no está implementado en modo BFF:', facturaId);
    return of([]);
  }

  /** Tareas: en modo BFF debería existir un endpoint en el BFF; mientras tanto devuelve vacío. */
  getTareas(_tablaId?: string): Observable<any> {
    console.warn('getTareas no está implementado en modo BFF');
    return of([]);
  }
  
  // Método genérico para crear una fila en cualquier tabla
  crearFila(tablaId: string, datos: any): Observable<any> {
    return throwError(() => new Error('crearFila no está implementado en modo BFF'));
  }
  
  // Método genérico para actualizar una fila en cualquier tabla
  actualizarFila(tablaId: string, filaId: string, datos: any): Observable<any> {
    return throwError(() => new Error('actualizarFila no está implementado en modo BFF'));
  }
  
  // Método genérico para borrar una fila de cualquier tabla
  borrarFila(tablaId: string, filaId: string): Observable<any> {
    return throwError(() => new Error('borrarFila no está implementado en modo BFF'));
  }
} 