import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, forkJoin, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';

export type FichajeStatus = 'noEntrada' | 'trabajando' | 'enPausa';

export interface Fichaje {
  id?: number;
  usuario?: string;
  fecha: string;
  hora: string;
  tipo: 'entrada' | 'pausa' | 'regreso' | 'salida' | 'entrar' | 'pausa' | 'finp' | 'salir';
  observaciones?: string;
  latitud?: number;
  longitud?: number;
  fecha_creacion?: string;
}

export interface Jornada {
  id?: number;
  userId?: string;
  fecha: string;
  entrada: string;
  salida: string | null;
  duracion?: string;
  pausas: {
    inicio: string;
    fin: string | null;
    duracion?: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class FichajesService {
  private statusSubject = new BehaviorSubject<FichajeStatus>(this.getStoredStatus());
  public status$ = this.statusSubject.asObservable();
  
  private jornadasSubject = new BehaviorSubject<Jornada[]>([]);
  public jornadas$ = this.jornadasSubject.asObservable();
  
  private currentJornadaSubject = new BehaviorSubject<Jornada | null>(null);
  public currentJornada$ = this.currentJornadaSubject.asObservable();
  
  private currentUserId: string = '';

  constructor(private apiService: ApiService) {
    // Obtener el ID del usuario actual (username)
    this.currentUserId = localStorage.getItem('username') || 'anonymous';
    
    // Solo verificamos el estado actual
    this.checkCurrentStatus();
  }

  // Obtener todos los fichajes
  getAllFichajes(): Observable<any> {
    return this.apiService.get('/bff/dolibarr/fichajes');
  }

  // Registrar entrada
  registrarEntrada(observaciones?: string): Observable<any> {
    const data = { observaciones };
    return this.apiService.post('/bff/dolibarr/registrarEntrada', data).pipe(
      tap(() => {
        this.setStatus('trabajando');
        this.iniciarNuevaJornada();
        this.cargarFichajesDesdeAPI(); // Actualizar fichajes desde API
      })
    );
  }

  // Iniciar pausa
  iniciarPausa(observaciones?: string): Observable<any> {
    const data = { observaciones };
    return this.apiService.post('/bff/dolibarr/iniciarPausa', data).pipe(
      tap(() => {
        this.setStatus('enPausa');
        this.registrarPausaEnJornada();
        this.cargarFichajesDesdeAPI(); // Actualizar fichajes desde API
      })
    );
  }

  // Terminar pausa (regreso)
  terminarPausa(observaciones?: string): Observable<any> {
    const data = { observaciones };
    return this.apiService.post('/bff/dolibarr/terminarPausa', data).pipe(
      tap(() => {
        this.setStatus('trabajando');
        this.registrarRegresoEnJornada();
        this.cargarFichajesDesdeAPI(); // Actualizar fichajes desde API
      })
    );
  }

  // Registrar salida
  registrarSalida(observaciones?: string): Observable<any> {
    const data = { observaciones };
    return this.apiService.post('/bff/dolibarr/registrarSalida', data).pipe(
      tap(() => {
        this.setStatus('noEntrada');
        this.finalizarJornada();
        this.cargarFichajesDesdeAPI(); // Actualizar fichajes desde API
      })
    );
  }

  // Cargar fichajes desde la API y procesarlos en jornadas
  cargarFichajesDesdeAPI(): void {
    console.log('Cargando fichajes desde API para usuario:', this.currentUserId);
    
    this.getAllFichajes().pipe(
      catchError(error => {
        console.error('Error al cargar fichajes desde API:', error);
        return of([]);
      })
    ).subscribe(fichajes => {
      if (fichajes && fichajes.length > 0) {
        console.log('Fichajes obtenidos de la API:', fichajes.length);
        // Filtrar fichajes del usuario actual
        const fichajesUsuario = fichajes.filter((fichaje: any) => 
          fichaje.usuario && fichaje.usuario.toLowerCase() === this.currentUserId.toLowerCase()
        );
        
        console.log('Fichajes del usuario actual:', fichajesUsuario.length);
        
        if (fichajesUsuario.length > 0) {
          // Procesar fichajes y convertirlos en jornadas
          const jornadas = this.procesarFichajesEnJornadas(fichajesUsuario);
          console.log('Jornadas procesadas:', jornadas.length);
          
          // Actualizar el subject de jornadas
          this.jornadasSubject.next(jornadas);
        } else {
          // Si no hay fichajes para este usuario, establecer un array vacío
          this.jornadasSubject.next([]);
        }
      } else {
        // Si no hay fichajes en absoluto, establecer un array vacío
        this.jornadasSubject.next([]);
      }
    });
  }
  
  // Procesar fichajes y convertirlos en jornadas
  private procesarFichajesEnJornadas(fichajes: any[]): Jornada[] {
    // Ordenar fichajes por fecha de creación (más antiguos primero para procesarlos en orden cronológico)
    const fichajesOrdenados = [...fichajes].sort((a, b) => 
      new Date(a.fecha_creacion).getTime() - new Date(b.fecha_creacion).getTime()
    );
    
    console.log('Procesando fichajes ordenados cronológicamente:', fichajesOrdenados);
    
    // Resultado: array de jornadas
    const jornadas: Jornada[] = [];
    
    // Agrupar fichajes por fecha
    const fichajesPorFecha: { [fecha: string]: any[] } = {};
    
    fichajesOrdenados.forEach(fichaje => {
      // Extraer la fecha (YYYY-MM-DD) de fecha_creacion
      const fechaCompleta = fichaje.fecha_creacion;
      const fecha = fechaCompleta.split(' ')[0];
      
      if (!fichajesPorFecha[fecha]) {
        fichajesPorFecha[fecha] = [];
      }
      
      fichajesPorFecha[fecha].push({
        ...fichaje,
        hora: fechaCompleta.split(' ')[1]
      });
    });
    
    // Procesar cada fecha
    Object.keys(fichajesPorFecha).forEach(fecha => {
      // Obtener fichajes del día ordenados cronológicamente
      const fichajesDia = fichajesPorFecha[fecha].sort((a, b) => 
        new Date(a.fecha_creacion).getTime() - new Date(b.fecha_creacion).getTime()
      );
      
      console.log(`Procesando fichajes del día ${fecha}:`, fichajesDia);
      
      // Variables para rastrear estado de procesamiento
      let jornadaActual: Jornada | null = null;
      let pausaActual: { inicio: string, fin: string | null } | null = null;
      
      // Recorrer todos los fichajes del día en orden cronológico
      for (const fichaje of fichajesDia) {
        console.log(`Procesando fichaje: ${fichaje.tipo} a las ${fichaje.hora}`);
        
        // CASO 1: Iniciar una nueva jornada con "entrar"
        if (fichaje.tipo === 'entrar' && jornadaActual === null) {
          jornadaActual = {
            id: parseInt(fichaje.id),
            userId: fichaje.usuario,
            fecha: fecha,
            entrada: fichaje.hora,
            salida: null,
            pausas: []
          };
          console.log('Iniciada nueva jornada con entrada a las:', fichaje.hora);
        }
        
        // CASO 2: Registrar pausa dentro de una jornada activa
        else if (fichaje.tipo === 'pausa' && jornadaActual !== null && pausaActual === null) {
          pausaActual = {
            inicio: fichaje.hora,
            fin: null
          };
          console.log('Iniciada pausa a las:', fichaje.hora);
        }
        
        // CASO 3: Finalizar una pausa
        else if (fichaje.tipo === 'finp' && jornadaActual !== null && pausaActual !== null) {
          pausaActual.fin = fichaje.hora;
          
          // Calcular duración de la pausa
          const inicioParts = pausaActual.inicio.split(':').map(Number);
          const finParts = (pausaActual.fin as string).split(':').map(Number);
          
          const inicioSeg = inicioParts[0] * 3600 + inicioParts[1] * 60 + inicioParts[2];
          const finSeg = finParts[0] * 3600 + finParts[1] * 60 + finParts[2];
          let diferenciaSegundos = finSeg - inicioSeg;
          
          // Ajustar si la pausa cruza medianoche
          if (diferenciaSegundos < 0) {
            diferenciaSegundos += 24 * 3600;
          }
          
          const horas = Math.floor(diferenciaSegundos / 3600);
          const minutos = Math.floor((diferenciaSegundos % 3600) / 60);
          const segundos = diferenciaSegundos % 60;
          
          jornadaActual.pausas.push({
            inicio: pausaActual.inicio,
            fin: pausaActual.fin,
            duracion: `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`
          });
          
          console.log('Finalizada pausa a las:', fichaje.hora, 'con duración:', jornadaActual.pausas[jornadaActual.pausas.length - 1].duracion);
          
          // Reiniciar para la próxima pausa
          pausaActual = null;
        }
        
        // CASO 4: Finalizar jornada con "salir"
        else if (fichaje.tipo === 'salir' && jornadaActual !== null) {
          jornadaActual.salida = fichaje.hora;
          
          // Calcular duración total de la jornada
          if (jornadaActual.entrada && jornadaActual.salida) {
            const entradaParts = jornadaActual.entrada.split(':').map(Number);
            const salidaParts = jornadaActual.salida.split(':').map(Number);
            
            const entradaSeg = entradaParts[0] * 3600 + entradaParts[1] * 60 + (entradaParts[2] || 0);
            const salidaSeg = salidaParts[0] * 3600 + salidaParts[1] * 60 + (salidaParts[2] || 0);
            let diferenciaSegundos = salidaSeg - entradaSeg;
            
            // Ajustar si la jornada cruza medianoche
            if (diferenciaSegundos < 0) {
              diferenciaSegundos += 24 * 3600;
            }
            
            // Restar duración de pausas
            let segundosPausas = 0;
            jornadaActual.pausas.forEach(pausa => {
              if (pausa.fin && pausa.duracion) {
                const pausaDuracion = pausa.duracion.split(':').map(Number);
                segundosPausas += pausaDuracion[0] * 3600 + pausaDuracion[1] * 60 + pausaDuracion[2];
              }
            });
            
            diferenciaSegundos -= segundosPausas;
            
            const horas = Math.floor(diferenciaSegundos / 3600);
            const minutos = Math.floor((diferenciaSegundos % 3600) / 60);
            const segundos = diferenciaSegundos % 60;
            
            jornadaActual.duracion = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
            
            console.log('Finalizada jornada a las:', fichaje.hora, 'con duración total:', jornadaActual.duracion);
          }
          
          // Añadir la jornada completada al array de jornadas
          jornadas.push({...jornadaActual});
          
          // Reiniciar para la próxima jornada
          jornadaActual = null;
          pausaActual = null;
        }
      }
      
      // Si queda una jornada sin cerrar al final del día, también la agregamos
      if (jornadaActual !== null) {
        console.log('Agregando jornada incompleta (sin salida):', jornadaActual);
        jornadas.push({...jornadaActual});
      }
    });
    
    // Ordenamos las jornadas por fecha y hora de entrada, más reciente primero
    const jornadasOrdenadas = jornadas.sort((a, b) => {
      // Primero comparar por fecha
      const fechaComparacion = new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
      if (fechaComparacion !== 0) return fechaComparacion;
      
      // Si es la misma fecha, comparar por hora de entrada (más reciente primero)
      const entradaA = a.entrada.split(':').map(Number);
      const entradaB = b.entrada.split(':').map(Number);
      
      const segundosA = entradaA[0] * 3600 + entradaA[1] * 60 + (entradaA[2] || 0);
      const segundosB = entradaB[0] * 3600 + entradaB[1] * 60 + (entradaB[2] || 0);
      
      return segundosB - segundosA;
    });
    
    console.log('Jornadas procesadas y ordenadas:', jornadasOrdenadas);
    return jornadasOrdenadas;
  }

  // Obtener estado actual
  getStatus(): FichajeStatus {
    return this.statusSubject.value;
  }

  // Establecer estado
  private setStatus(status: FichajeStatus): void {
    localStorage.setItem(`fichajeStatus_${this.currentUserId}`, status);
    this.statusSubject.next(status);
  }

  // Obtener estado almacenado
  private getStoredStatus(): FichajeStatus {
    // Obtener el ID del usuario actual (username)
    const userId = localStorage.getItem('username') || 'anonymous';
    return (localStorage.getItem(`fichajeStatus_${userId}`) as FichajeStatus) || 'noEntrada';
  }

  // Iniciar nueva jornada al comenzar el día
  private iniciarNuevaJornada(): void {
    const now = new Date();
    const fecha = now.toISOString().split('T')[0];
    const hora = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const jornada: Jornada = {
      id: Date.now(),
      userId: this.currentUserId,
      fecha: fecha,
      entrada: hora,
      salida: null,
      pausas: []
    };
    
    this.currentJornadaSubject.next(jornada);
  }

  // Registrar pausa en la jornada actual
  private registrarPausaEnJornada(): void {
    const currentJornada = this.currentJornadaSubject.value;
    if (currentJornada) {
      const now = new Date();
      const hora = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      currentJornada.pausas.push({
        inicio: hora,
        fin: null
      });
      
      this.currentJornadaSubject.next({...currentJornada});
    }
  }

  // Registrar regreso de pausa en la jornada actual
  private registrarRegresoEnJornada(): void {
    const currentJornada = this.currentJornadaSubject.value;
    if (currentJornada && currentJornada.pausas.length > 0) {
      const now = new Date();
      const hora = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      // Encontrar la última pausa sin finalizar
      const ultimaPausa = currentJornada.pausas[currentJornada.pausas.length - 1];
      if (ultimaPausa && ultimaPausa.fin === null) {
        ultimaPausa.fin = hora;
        
        // Calcular duración de la pausa
        const inicioPartes = ultimaPausa.inicio.split(':').map(Number);
        const finPartes = hora.split(':').map(Number);
        
        const inicioSeg = inicioPartes[0] * 3600 + inicioPartes[1] * 60 + inicioPartes[2];
        const finSeg = finPartes[0] * 3600 + finPartes[1] * 60 + finPartes[2];
        let diferenciaSegundos = finSeg - inicioSeg;
        
        // Ajustar si la pausa cruza medianoche
        if (diferenciaSegundos < 0) {
          diferenciaSegundos += 24 * 3600;
        }
        
        const horas = Math.floor(diferenciaSegundos / 3600);
        const minutos = Math.floor((diferenciaSegundos % 3600) / 60);
        const segundos = diferenciaSegundos % 60;
        
        ultimaPausa.duracion = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
      }
      
      this.currentJornadaSubject.next({...currentJornada});
    }
  }

  // Finalizar jornada actual
  private finalizarJornada(): void {
    // Solo actualizamos el estado de la jornada actual
    this.currentJornadaSubject.next(null);
  }

  // Verificar estado actual al cargar la aplicación
  private checkCurrentStatus(): void {
    // Verificamos directamente desde la API si hay una jornada actual
    this.cargarFichajesDesdeAPI();
    
    // Por defecto, establecer como 'noEntrada' hasta que se verifique
    this.setStatus('noEntrada');
    
    // Después de cargar los datos de la API, determinar el estado actual
    this.getAllFichajes().pipe(
      catchError(error => {
        console.error('Error al verificar estado actual:', error);
        return of([]);
      })
    ).subscribe(fichajes => {
      if (fichajes && fichajes.length > 0) {
        // Filtrar fichajes del usuario actual
        const fichajesUsuario = fichajes.filter((fichaje: any) => 
          fichaje.usuario && fichaje.usuario.toLowerCase() === this.currentUserId.toLowerCase()
        );
        
        if (fichajesUsuario.length > 0) {
          // Ordenar por fecha de creación (más recientes primero)
          const fichajesOrdenados = [...fichajesUsuario].sort((a, b) => 
            new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime()
          );
          
          // Obtener el último fichaje para determinar el estado
          const ultimoFichaje = fichajesOrdenados[0];
          
          if (ultimoFichaje) {
            if (ultimoFichaje.tipo === 'entrar') {
              this.setStatus('trabajando');
            } else if (ultimoFichaje.tipo === 'pausa') {
              this.setStatus('enPausa');
            } else if (ultimoFichaje.tipo === 'salir') {
              this.setStatus('noEntrada');
            } else if (ultimoFichaje.tipo === 'finp') {
              this.setStatus('trabajando');
            }
          }
        }
      }
    });
  }

  // Obtener jornadas
  getJornadas(): Jornada[] {
    return this.jornadasSubject.value;
  }

  // Obtener jornada actual
  getCurrentJornada(): Jornada | null {
    return this.currentJornadaSubject.value;
  }
  
  // Método para actualizar el ID de usuario después de iniciar sesión
  actualizarUsuario(userId: string): void {
    if (userId !== this.currentUserId) {
      console.log('Actualizando usuario de fichajes:', userId);
      this.currentUserId = userId;
      
      // Cargar datos de la API para el nuevo usuario
      this.cargarFichajesDesdeAPI();
      this.checkCurrentStatus();
    }
  }
  
  // Método para forzar una recarga de los datos desde la API
  recargarDatosDesdeAPI(): void {
    // Vaciar el historial actual
    this.jornadasSubject.next([]);
    
    // Cargar nuevos datos desde la API
    this.cargarFichajesDesdeAPI();
  }
}
