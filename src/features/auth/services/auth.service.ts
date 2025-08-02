import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

export interface User {
  id: number;
  username: string;
  email: string;
  description?: string;
  avatar?: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  description?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly API_URL = 'http://localhost:3000/api/auth';

  //============ SIGNALS ÉTAT ============

  private _currentUser = signal<User | null>(null);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  //============ COMPUTED PUBLICS ============

  currentUser = this._currentUser.asReadonly();
  isLoggedIn = computed(() => this._currentUser() !== null);
  isAdmin = computed(() => this._currentUser()?.role === 'admin');
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();

  constructor() {
    this.initializeFromStorage();
  }

  //============ AUTHENTIFICATION ============

  async login(email: string, password: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(
        this.http.post<{ message: string; token: string; user: User }>(`${this.API_URL}/login`, {
          email,
          password
        })
      );

      this.storeAuthData(response.token, response.user);
      this._currentUser.set(response.user);
      
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      this._error.set(errorMessage);
      throw new Error(errorMessage);
    } finally {
      this._loading.set(false);
    }
  }

  async register(data: RegisterRequest): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(
        this.http.post<{ message: string; user: User }>(`${this.API_URL}/register`, data)
      );

    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      this._error.set(errorMessage);
      throw new Error(errorMessage);
    } finally {
      this._loading.set(false);
    }
  }

  logout(): void {
    this.clearAuthData();
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  //============ VALIDATION TOKEN ============

  async validateToken(): Promise<boolean> {
    const token = this.getStoredToken();
    if (!token) return false;

    try {
      const response = await firstValueFrom(
        this.http.get<{ message: string; user: User }>(`${this.API_URL}/validate`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );

      this._currentUser.set(response.user);
      return true;

    } catch {
      this.logout();
      return false;
    }
  }

  //============ GESTION STOCKAGE ============

  private initializeFromStorage(): void {
    const userData = localStorage.getItem('antre_user');
    if (userData) {
      try {
        this._currentUser.set(JSON.parse(userData));
      } catch {
        this.clearAuthData();
      }
    }
  }

  private storeAuthData(token: string, user: User): void {
    localStorage.setItem('antre_auth_token', token);
    localStorage.setItem('antre_user', JSON.stringify(user));
  }

  private clearAuthData(): void {
    localStorage.removeItem('antre_auth_token');
    localStorage.removeItem('antre_user');
  }

  getStoredToken(): string | null {
    return localStorage.getItem('antre_auth_token');
  }

  //============ SYNCHRONISATION ÉTAT ============

  updateCurrentUser(user: User): void {
    this._currentUser.set(user);
    localStorage.setItem('antre_user', JSON.stringify(user));
  }

  clearError(): void {
    this._error.set(null);
  }

  //============ UTILITAIRES ============

  private extractErrorMessage(error: any): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.error || error.message || 'Erreur serveur';
    }
    return error instanceof Error ? error.message : 'Erreur inconnue';
  }
}