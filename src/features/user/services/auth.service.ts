import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

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
  private readonly API_URL = `${environment.apiUrl}/auth`;

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
      this.handleError(error);
    } finally {
      this._loading.set(false);
    }
  }

  async register(userData: RegisterRequest): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(
        this.http.post<{ message: string; token: string; user: User }>(`${this.API_URL}/register`, userData)
      );

      this.storeAuthData(response.token, response.user);
      this._currentUser.set(response.user);

    } catch (error) {
      this.handleError(error);
    } finally {
      this._loading.set(false);
    }
  }

  async validateToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    try {
      const response = await firstValueFrom(
        this.http.get<{ user: User }>(`${this.API_URL}/validate`)
      );

      this._currentUser.set(response.user);
      this.storeUser(response.user);
      return true;

    } catch (error) {
      this.logout();
      return false;
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  //============ GESTION ERREURS ============

  clearError(): void {
    this._error.set(null);
  }

  //============ UPDATE USER ============

  updateCurrentUser(user: User): void {
    this._currentUser.set(user);
    this.storeUser(user);
  }

  //============ PRIVATE METHODS ============

  private async initializeFromStorage(): Promise<void> {
    const token = this.getToken();
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this._currentUser.set(user);
        await this.validateToken();
      } catch {
        this.logout();
      }
    }
  }

  private storeAuthData(token: string, user: User): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  private storeUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  private handleError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      this._error.set(error.error?.message || 'Une erreur est survenue');
    } else {
      this._error.set('Une erreur inattendue est survenue');
    }
  }

  //============ PUBLIC METHODS ============

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}