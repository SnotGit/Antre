import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService, User } from '@features/auth/services/auth.service';

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
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly API_URL = `${environment.apiUrl}/user`;

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
      const response = await firstValueFrom(
        this.http.get<{ message: string; user: User }>(`${this.API_URL}/profile`)
      );
      
      this.updateUserInStorage(response.user);
      return response.user;

    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Erreur inconnue');
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  async updateProfile(username: string, description: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(
        this.http.put<{ message: string; user: User }>(`${this.API_URL}/profile`, {
          username: username.trim(),
          description: description.trim()
        })
      );

      this.updateUserInStorage(response.user);
      this._successMessage.set('Profil mis à jour avec succès');

    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      this._loading.set(false);
    }
  }

  async updateEmail(email: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(
        this.http.put<{ message: string; user: User }>(`${this.API_URL}/email`, {
          email: email.trim()
        })
      );

      this.updateUserInStorage(response.user);
      this._successMessage.set('Email mis à jour avec succès');

    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Erreur inconnue');
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

      const response = await firstValueFrom(
        this.http.post<UploadAvatarResponse>(`${this.API_URL}/upload-avatar`, formData)
      );

      this.updateUserInStorage(response.user);
      this._successMessage.set('Avatar mis à jour avec succès');

    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      this._loading.set(false);
    }
  }

  //============ GESTION MOT DE PASSE ============

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(
        this.http.put<{ message: string }>(`${this.API_URL}/change-password`, {
          currentPassword,
          newPassword
        })
      );

      this._successMessage.set('Mot de passe modifié avec succès');

    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      this._loading.set(false);
    }
  }

  //============ UTILITAIRES ============

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