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
  role: 'admin' | 'user' | 'dev';
  isDev?: boolean;
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

export interface DevUsersResponse {
  users: User[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/api';
  private readonly TOKEN_KEY = 'antre_auth_token';
  private readonly USER_KEY = 'antre_user';
  private readonly DEV_USER_KEY = 'antre_dev_user';

  // Signals pour l'état d'authentification
  private _currentUser = signal<User | null>(null);
  private _isDevMode = signal<boolean>(false);
  private _realUser = signal<User | null>(null);
  private _userChanged = signal<number>(0);

  // Computed signals publics
  currentUser = this._currentUser.asReadonly();
  isLoggedIn = computed(() => this._currentUser() !== null);
  isAdmin = computed(() => this._currentUser()?.role === 'admin');
  isDevMode = this._isDevMode.asReadonly();
  userChanged = this._userChanged.asReadonly();
  canUseDev = computed(() => {
    const user = this._currentUser();
    return user?.isDev === true;
  });

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeSession();
  }

  // ============ AUTHENTIFICATION RÉELLE ============

  login(email: string, password: string): Observable<LoginResponse> {
    const loginData: LoginRequest = { email, password };

    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, loginData).pipe(
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));

        this._currentUser.set(response.user);
        this._isDevMode.set(false);

        console.log('✅ Connexion réussie:', response.user.username);
      }),
      catchError(error => {
        console.error('❌ Erreur de connexion:', error);
        throw error;
      })
    );
  }

  register(userData: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.API_URL}/auth/register`, userData).pipe(
      tap(response => {
        console.log('✅ Inscription réussie:', response.user.username);
      }),
      catchError(error => {
        console.error('❌ Erreur d\'inscription:', error);
        throw error;
      })
    );
  }

  // ============ UPLOAD AVATAR ============

  uploadAvatar(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('avatar', file);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });

    return this.http.post(`${this.API_URL}/auth/upload-avatar`, formData, {
      headers: headers
    }).pipe(
      tap((response: any) => {
        if (response.user) {
          const currentUser = this._currentUser();
          if (currentUser) {
            const updatedUser = { ...currentUser, avatar: response.user.avatar };
            this._currentUser.set(updatedUser);
            localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
            
            if (this._isDevMode()) {
              localStorage.setItem(this.DEV_USER_KEY, JSON.stringify(updatedUser));
            }
          }
        }
        console.log('✅ Avatar uploadé avec succès');
      }),
      catchError(error => {
        console.error('❌ Erreur upload avatar:', error);
        throw error;
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.DEV_USER_KEY);

    this._currentUser.set(null);
    this._isDevMode.set(false);
    this._realUser.set(null);

    this.router.navigate(['/']);
    console.log('✅ Déconnexion réussie');
  }

  // ============ MODE DÉVELOPPEMENT ============

  private switchToDevUser(devUserType: 'elena' | 'snot'): void {
    const currentUser = this._currentUser();
    if (!currentUser || !currentUser.isDev) {
      console.error('❌ Accès mode dev non autorisé');
      return;
    }

    this._realUser.set(currentUser);

    // Appel API pour récupérer les données du dev user
    this.http.get<DevUsersResponse>(`${this.API_URL}/auth/dev-users`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (response) => {
        const targetUser = response.users.find(user =>
          devUserType === 'elena' ? user.username === 'Elena Nova' : user.username === 'Snot'
        );

        if (targetUser) {
          this._currentUser.set(targetUser);
          this._isDevMode.set(true);
          localStorage.setItem(this.DEV_USER_KEY, JSON.stringify(targetUser));

          // Notifier le changement d'utilisateur
          this._userChanged.set(this._userChanged() + 1);

          console.log(`🔄 Passage en mode dev - ${targetUser.username}`);
        } else {
          console.error('❌ Utilisateur dev non trouvé');
        }
      },
      error: (error) => {
        console.error('❌ Erreur récupération dev users:', error);
      }
    });
  }

  switchToElena(): void {
    this.switchToDevUser('elena');
  }

  switchToSnot(): void {
    this.switchToDevUser('snot');
  }

  exitDevMode(): void {
    const realUser = this._realUser();
    if (!realUser) {
      console.error('❌ Aucun utilisateur réel sauvegardé');
      return;
    }

    this._currentUser.set(realUser);
    this._isDevMode.set(false);
    this._realUser.set(null);
    localStorage.removeItem(this.DEV_USER_KEY);

    // Notifier le changement d'utilisateur
    this._userChanged.set(this._userChanged() + 1);

    console.log('🔄 Retour au mode normal -', realUser.username);
  }

  // ============ UTILITAIRES ============

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
      // Vérifier si on était en mode dev
      const devUser = localStorage.getItem(this.DEV_USER_KEY);
      if (devUser) {
        const parsedDevUser = JSON.parse(devUser);
        this._currentUser.set(parsedDevUser);
        this._isDevMode.set(true);

        const savedUser = localStorage.getItem(this.USER_KEY);
        if (savedUser) {
          this._realUser.set(JSON.parse(savedUser));
        }

        console.log('🔄 Session dev restaurée -', parsedDevUser.username);
        return;
      }

      // Vérifier la session normale
      const token = localStorage.getItem(this.TOKEN_KEY);
      const savedUser = localStorage.getItem(this.USER_KEY);

      if (token && savedUser) {
        const user = JSON.parse(savedUser);
        this._currentUser.set(user);
        console.log('✅ Session restaurée -', user.username);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de la session:', error);
      this.logout();
    }
  }

  // ============ VALIDATION TOKEN CORRIGÉE ============

  validateToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      return of(false);
    }

    return this.http.get<{ user: User }>(`${this.API_URL}/auth/profile`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => {
        console.log('✅ Données utilisateur récupérées:', response.user);
        
        // Mettre à jour l'utilisateur actuel
        this._currentUser.set(response.user);
        
        // Sauvegarder en localStorage
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
        
        // Si en mode dev, mettre à jour aussi le dev user
        if (this._isDevMode()) {
          localStorage.setItem(this.DEV_USER_KEY, JSON.stringify(response.user));
        }
        
        console.log('✅ Utilisateur mis à jour avec avatar:', response.user.avatar);
      }),
      switchMap(() => of(true)),
      catchError((error) => {
        console.error('❌ Erreur validateToken:', error);
        this.logout();
        return of(false);
      })
    );
  }
}