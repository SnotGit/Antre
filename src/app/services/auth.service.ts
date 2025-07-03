import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

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
  private readonly API_URL = 'http://localhost:3000/api';

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
      const response = await fetch(`${this.API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Email ou mot de passe incorrect');
      }

      const data = await response.json();
      this.storeAuthData(data.token, data.user);
      this._currentUser.set(data.user);
      
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Erreur de connexion');
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  async register(data: RegisterRequest): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const response = await fetch(`${this.API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'inscription');
      }

    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Erreur d\'inscription');
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  logout(): void {
    this.clearAuthData();
    this._currentUser.set(null);
    this.router.navigate(['/']);
  }

  //============ VALIDATION TOKEN ============

  async validateToken(): Promise<boolean> {
    const token = this.getStoredToken();
    if (!token) return false;

    try {
      const response = await fetch(`${this.API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        this.logout();
        return false;
      }

      const data = await response.json();
      this._currentUser.set(data.user);
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
}