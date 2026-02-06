import { Injectable, Inject, InjectionToken, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Creamos una interfaz para los métodos que necesitamos de AuthService
export interface TokenProvider {
  getToken(): string | null;
}

// Token de inyección para el proveedor de tokens
export const TOKEN_PROVIDER = new InjectionToken<TokenProvider>('TOKEN_PROVIDER');

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(
    private http: HttpClient,
    @Optional() @Inject(TOKEN_PROVIDER) private tokenProvider: TokenProvider | null
  ) { }

  get<T>(endpoint: string, params: any = {}): Observable<T> {
    return this.http.get<T>(endpoint, { params, withCredentials: true });
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(endpoint, body, { withCredentials: true });
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(endpoint, body, { withCredentials: true });
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(endpoint, { withCredentials: true });
  }
}
