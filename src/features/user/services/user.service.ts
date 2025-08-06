import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService, User } from '@features/user/services/auth.service';

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

export interface UserStats {
  drafts: number;
  published: number;
  totalLikes: number;
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

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(
        this.http.put<{ message: string }>(`${this.API_URL}/password`, {
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

  async uploadAvatar(file: File): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await firstValueFrom(
        this.http.post<UploadAvatarResponse>(`${this.API_URL}/avatar`, formData)
      );

      this.updateUserInStorage(response.user);
      this._successMessage.set('Avatar mis à jour avec succès');

    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      this._loading.set(false);
    }
  }

  //============ STATISTIQUES UTILISATEUR ============

  async getStats(): Promise<UserStats> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ stats: UserStats }>(`${this.API_URL}/stats`)
      );
      return response.stats || { drafts: 0, published: 0, totalLikes: 0 };
    } catch (error) {
      throw error;
    }
  }

  //============ UTILITIES ============

  clearMessages(): void {
    this._error.set(null);
    this._successMessage.set(null);
  }

  private updateUserInStorage(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
    this.authService['_currentUser'].set(user);
  }

  private handleError(error: any): void {
    if (error?.error?.message) {
      this._error.set(error.error.message);
    } else if (error instanceof Error) {
      this._error.set(error.message);
    } else {
      this._error.set('Erreur inconnue');
    }
  }
}