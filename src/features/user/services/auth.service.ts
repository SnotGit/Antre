import { Injectable, inject, signal, computed, effect } from '@angular/core';
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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly API_URL = `${environment.apiUrl}/auth`;

  //======= SIGNALS STATE =======

  private readonly _currentUser = signal<User | null>(this.getUserFromStorage());
  private readonly _initializing = signal<boolean>(true);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  //======= COMPUTED PUBLICS =======

  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this._currentUser() !== null);
  readonly isAdmin = computed(() => this._currentUser()?.role === 'admin');
  readonly initializing = this._initializing.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  //======= EFFECTS REACTIVE =======

  private readonly syncUserToStorage = effect(() => {
    const user = this._currentUser();
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  });

  private readonly initializeAuth = effect(() => {
    const user = this._currentUser();
    const token = this.getToken();
    
    if (this._initializing() && user && token) {
      this.validateTokenSilently();
    }
  });

  //======= AUTHENTICATION =======

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

      localStorage.setItem('token', response.token);
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

      localStorage.setItem('token', response.token);
      this._currentUser.set(response.user);

    } catch (error) {
      this.handleError(error);
    } finally {
      this._loading.set(false);
    }
  }

  //======= TOKEN VALIDATION =======

  private async validateTokenSilently(): Promise<void> {
    const token = this.getToken();
    if (!token) {
      this._initializing.set(false);
      return;
    }

    try {
      const response = await firstValueFrom(
        this.http.get<{ user: User }>(`${this.API_URL}/validate`)
      );

      this._currentUser.set(response.user);

    } catch (error) {
      this.handleValidationError(error);
    } finally {
      this._initializing.set(false);
    }
  }

  logout(reason?: string): void {
    localStorage.removeItem('token');
    this._currentUser.set(null);
    
    if (reason) {
      this._error.set(reason);
    }
    
    this.router.navigate(['/auth/login']);
  }

  //======= ERROR HANDLING =======

  private handleValidationError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 401:
          this.logout('Session expirée, veuillez vous reconnecter');
          break;
        case 500:
        case 0:
          break;
        default:
          this.logout('Erreur de connexion');
      }
    } else {
      this.logout('Erreur inattendue');
    }
  }

  private handleError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      this._error.set(error.error?.message || 'Une erreur est survenue');
    } else {
      this._error.set('Une erreur inattendue est survenue');
    }
  }

  //======= UTILITIES =======

  clearError(): void {
    this._error.set(null);
  }

  updateCurrentUser(user: User): void {
    this._currentUser.set(user);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  //======= PRIVATE HELPERS =======

  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  }
}