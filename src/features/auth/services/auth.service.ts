import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from './token.service';
import { User } from './login.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);

  //======= SIGNALS STATE =======

  private readonly _currentUser = signal<User | null>(this.getUserFromStorage());
  private readonly _initializing = signal<boolean>(true);
  private readonly _error = signal<string | null>(null);

  //======= COMPUTED PUBLICS =======

  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this._currentUser() !== null);
  readonly isAdmin = computed(() => this._currentUser()?.role === 'admin');
  readonly initializing = this._initializing.asReadonly();
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
    const hasToken = this.tokenService.hasToken();
    
    if (this._initializing() && user && hasToken) {
      this.validateTokenSilently();
    }
  });

  //======= STATE MANAGEMENT =======

  setCurrentUser(user: User): void {
    this._currentUser.set(user);
    this._error.set(null);
  }

  clearCurrentUser(): void {
    this._currentUser.set(null);
  }

  setError(error: string): void {
    this._error.set(error);
  }

  clearError(): void {
    this._error.set(null);
  }

  updateCurrentUser(user: User): void {
    this._currentUser.set(user);
  }

  //======= TOKEN VALIDATION =======

  private async validateTokenSilently(): Promise<void> {
    if (!this.tokenService.hasToken()) {
      this._initializing.set(false);
      return;
    }

    try {
      const tokenInfo = await this.tokenService.getTokenInfo();
      
      if (tokenInfo.isValid && tokenInfo.user) {
        this._currentUser.set(tokenInfo.user);
      } else {
        this.handleTokenError(tokenInfo.error || 'Token invalide');
      }
    } catch (error) {
      this.handleTokenError('Erreur de validation du token');
    } finally {
      this._initializing.set(false);
    }
  }

  //======= LOGOUT =======

  logout(reason?: string): void {
    this.tokenService.removeToken();
    this._currentUser.set(null);
    
    if (reason) {
      this._error.set(reason);
    }
    
    this.router.navigate(['/auth/login']);
  }

  //======= ERROR HANDLING =======

  private handleTokenError(error: string): void {
    if (error.includes('expiré') || error.includes('invalide')) {
      this.logout('Session expirée, veuillez vous reconnecter');
    } else if (error.includes('connexion')) {
      // Erreur réseau : ne pas déconnecter automatiquement
    } else {
      this.logout('Erreur de connexion');
    }
  }

  //======= UTILITIES =======

  getToken(): string | null {
    return this.tokenService.getToken();
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