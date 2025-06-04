// src/app/services/auth.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';

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

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface UploadAvatarResponse {
  message: string;
  user: User;
  avatarUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/api';
  private readonly TOKEN_KEY = 'antre_auth_token';
  private readonly USER_KEY = 'antre_user';

  // Signals pour l'état d'authentification
  private _currentUser = signal<User | null>(null);
  private _userChanged = signal<number>(0);

  // Computed signals publics
  currentUser = this._currentUser.asReadonly();
  isLoggedIn = computed(() => this._currentUser() !== null);
  isAdmin = computed(() => this._currentUser()?.role === 'admin');
  userChanged = this._userChanged.asReadonly();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeSession();
  }

  // ============ AUTHENTIFICATION ============

  login(email: string, password: string): Observable<LoginResponse> {
    const loginData: LoginRequest = { email, password };

    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, loginData).pipe(
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
        this._currentUser.set(response.user);
        this.triggerUserChange();
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  register(userData: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.API_URL}/auth/register`, userData).pipe(
      catchError(error => {
        throw error;
      })
    );
  }

  // ============ UPLOAD AVATAR ============

  uploadAvatar(file: File): Observable<UploadAvatarResponse> {
    const formData = new FormData();
    formData.append('avatar', file);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });

    return this.http.post<UploadAvatarResponse>(`${this.API_URL}/auth/upload-avatar`, formData, {
      headers: headers
    }).pipe(
      tap((response: UploadAvatarResponse) => {
        if (response.user) {
          const currentUser = this._currentUser();
          if (currentUser && currentUser.id === response.user.id) {
            const updatedUser: User = { ...currentUser, avatar: response.user.avatar };
            this._currentUser.set(updatedUser);
            localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
            this.triggerUserChange();
          }
        }
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  // ============ MISE À JOUR PROFIL ============

  updateProfile(username: string, description: string): Observable<{message: string, user: User}> {
    const profileData = { username, description };
    
    return this.http.put<{message: string, user: User}>(`${this.API_URL}/auth/profile`, profileData, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap((response) => {
        if (response.user) {
          this._currentUser.set(response.user);
          localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
          this.triggerUserChange();
        }
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

    this._currentUser.set(null);
    this.triggerUserChange();

    this.router.navigate(['/']);
  }

  // ============ UTILITAIRES ============

  private triggerUserChange(): void {
    this._userChanged.set(this._userChanged() + 1);
  }

  getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUserId(): number | null {
    return this._currentUser()?.id || null;
  }

  canEditStory(storyUserId: number): boolean {
    const currentUser = this._currentUser();
    if (!currentUser) return false;
    return currentUser.id === storyUserId;
  }

  // ============ INITIALISATION ============

  private initializeSession(): void {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      const savedUser = localStorage.getItem(this.USER_KEY);

      if (token && savedUser) {
        const user = JSON.parse(savedUser);
        this._currentUser.set(user);
      }
    } catch (error) {
      this.logout();
    }
  }

  // ============ VALIDATION TOKEN ============

  validateToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      return of(false);
    }

    return this.http.get<{ user: User }>(`${this.API_URL}/auth/profile`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => {
        this._currentUser.set(response.user);
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
        this.triggerUserChange();
      }),
      switchMap(() => of(true)),
      catchError((error) => {
        this.logout();
        return of(false);
      })
    );
  }
}