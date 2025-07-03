import { Injectable, inject, signal, computed } from '@angular/core';
import { AuthService, User } from './auth.service';

export interface UpdateProfileRequest {
  username: string;
  description: string;
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
  private readonly API_URL = 'http://localhost:3000/api';

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

  async updateProfile(username: string, description: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    const response = await fetch(`${this.API_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authService.getStoredToken()}`
      },
      body: JSON.stringify({ username: username.trim(), description: description.trim() })
    });

    if (!response.ok) {
      const error = await response.json();
      this._error.set(error.error || 'Erreur lors de la mise à jour');
      this._loading.set(false);
      return;
    }

    const data = await response.json();
    this.updateUserInStorage(data.user);
    this._successMessage.set('Profil mis à jour avec succès');
    this._loading.set(false);
  }

  async updateEmail(email: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this._error.set('Format d\'email invalide');
      this._loading.set(false);
      return;
    }

    const response = await fetch(`${this.API_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authService.getStoredToken()}`
      },
      body: JSON.stringify({ email: email.trim() })
    });

    if (!response.ok) {
      const error = await response.json();
      this._error.set(error.error || 'Erreur lors de la mise à jour de l\'email');
      this._loading.set(false);
      return;
    }

    const data = await response.json();
    this.updateUserInStorage(data.user);
    this._successMessage.set('Email mis à jour avec succès');
    this._loading.set(false);
  }

  //============ CHANGEMENT MOT DE PASSE ============

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    const response = await fetch(`${this.API_URL}/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authService.getStoredToken()}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    if (!response.ok) {
      const error = await response.json();
      this._error.set(error.error || 'Erreur lors du changement de mot de passe');
      this._loading.set(false);
      return;
    }

    this._successMessage.set('Mot de passe modifié avec succès');
    this._loading.set(false);
  }

  //============ UPLOAD AVATAR ============

  async uploadAvatar(file: File): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    if (!file.type.startsWith('image/') || file.size > 500 * 1024) {
      this._error.set('Fichier avatar invalide');
      this._loading.set(false);
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${this.API_URL}/auth/upload-avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authService.getStoredToken()}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      this._error.set(error.error || 'Erreur lors de l\'upload');
      this._loading.set(false);
      return;
    }

    const data = await response.json();
    this.updateUserInStorage(data.user);
    this._successMessage.set('Avatar mis à jour avec succès');
    this._loading.set(false);
  }

  //============ UTILITAIRES ============

  private updateUserInStorage(user: User): void {
    this.authService.updateCurrentUser(user);
  }

  getAvatarUrl(): string {
    const user = this.currentUser();
    return user?.avatar ? `http://localhost:3000${user.avatar}` : '';
  }

  clearMessages(): void {
    this._error.set(null);
    this._successMessage.set(null);
  }
}