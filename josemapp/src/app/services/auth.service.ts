import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { TokenProvider } from './api.service';

interface LoginResponse {
  success?: {
    code: number;
    entity: string;
    message: string;
  };
  error?: {
    code: number;
    message: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService implements TokenProvider {
  private usernameSubject = new BehaviorSubject<string | null>(localStorage.getItem('username'));
  public username$ = this.usernameSubject.asObservable();

  constructor(
    private http: HttpClient
  ) { }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      '/bff/auth/login',
      { username, password },
      { withCredentials: true }
    ).pipe(
      tap(response => {
        if (response.success) {
          this.storeUsername(username);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('username');
    this.usernameSubject.next(null);
    // Logout en servidor (best-effort)
    this.http.post('/bff/auth/logout', {}, { withCredentials: true }).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  isLoggedIn(): boolean {
    // Mantiene compatibilidad con el guard actual: si hay username en storage, consideramos sesión iniciada.
    // La sesión real la controla el BFF por cookie HttpOnly.
    return !!this.getUsername();
  }

  getToken(): string | null {
    // Ya no exponemos token en cliente; el BFF lo guarda en la sesión.
    return null;
  }
  
  getUsername(): string | null {
    return this.usernameSubject.value;
  }
  
  private storeUsername(username: string): void {
    localStorage.setItem('username', username);
    this.usernameSubject.next(username);
  }
}
