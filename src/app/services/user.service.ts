import { Injectable, inject, signal } from '@angular/core';
import { AuthService, User } from './auth.service';

export interface UpdateProfileRequest {
  username: string;
  description: string;
}

export interface UpdateEmailRequest {
  email: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UploadAvatarResponse {
  message: string;
  user: User;
  avatarUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly authService = inject(AuthService);
  private readonly API_URL = 'http://localhost:3000/api/user';

  //============ SIGNALS ÉTAT ============

  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _successMessage = signal<string | null>(null);

  //============ COMPUTED PUBLICS ============

  loading = this._loading.asReadonly();
  error = this._error.asReadonly();
  successMessage = this._successMessage.asReadonly();
  currentUser = this.authService.currentUser;

  //============ GESTION PROFIL ============

  async getProfile(): Promise<User | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const response = await this.fetchWithAuth(`${this.API_URL}/profile`);
      const data = await response.json();
      
      this.updateUserInStorage(data.user);
      this._loading.set(false);
      return data.user;

    } catch (error) {
      this._loading.set(false);
      return null;
    }
  }

  async updateProfile(username: string, description: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const response = await this.fetchWithAuth(`${this.API_URL}/profile`, {
        method: 'PUT',
        body: JSON.stringify({ username: username.trim(), description: description.trim() })
      });

      const data = await response.json();
      this.updateUserInStorage(data.user);
      this._successMessage.set('Profil mis à jour avec succès');

    } catch (error) {
      // Error already set in fetchWithAuth
    } finally {
      this._loading.set(false);
    }
  }

  async updateEmail(email: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const response = await this.fetchWithAuth(`${this.API_URL}/email`, {
        method: 'PUT',
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();
      this.updateUserInStorage(data.user);
      this._successMessage.set('Email mis à jour avec succès');

    } catch (error) {
      // Error already set in fetchWithAuth
    } finally {
      this._loading.set(false);
    }
  }

  //============ GESTION AVATAR ============

  async uploadAvatar(file: File): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const token = this.authService.getStoredToken();
      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(`${this.API_URL}/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        this._error.set(error.error || 'Erreur lors de l\'upload');
        return;
      }

      const data = await response.json();
      this.updateUserInStorage(data.user);
      this._successMessage.set('Avatar mis à jour avec succès');

    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Erreur lors de l\'upload');
    } finally {
      this._loading.set(false);
    }
  }

  //============ GESTION MOT DE PASSE ============

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const response = await this.fetchWithAuth(`${this.API_URL}/change-password`, {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
      });

      await response.json();
      this._successMessage.set('Mot de passe modifié avec succès');

    } catch (error) {
      // Error already set in fetchWithAuth
    } finally {
      this._loading.set(false);
    }
  }

  //============ UTILITAIRES ============

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.authService.getStoredToken();
    if (!token) {
      this._error.set('Non authentifié');
      throw new Error('Non authentifié');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erreur serveur' }));
      this._error.set(error.error || 'Erreur réseau');
      throw new Error(error.error || 'Erreur réseau');
    }

    return response;
  }

  private updateUserInStorage(user: User): void {
    this.authService.updateCurrentUser(user);
  }

  clearMessages(): void {
    this._error.set(null);
    this._successMessage.set(null);
  }

  clearError(): void {
    this._error.set(null);
  }
}