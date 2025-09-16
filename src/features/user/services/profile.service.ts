import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from '../../auth/services/auth.service';

export interface ProfileData {
  username: string;
  description: string;
  playerId: string;
  playerDays: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly API_URL = `${environment.apiUrl}/user/profile`;

  //============ SIGNALS ÉTAT ============

  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _successMessage = signal<string | null>(null);

  //============ COMPUTED PUBLICS ============

  loading = this._loading.asReadonly();
  error = this._error.asReadonly();
  successMessage = this._successMessage.asReadonly();

  //============ UPDATE PROFILE ============

  async updateProfile(profileData: ProfileData, file?: File | null): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      if (file) {
        await this.uploadAvatar(file);
      }

      const response = await firstValueFrom(
        this.http.put<{ message: string; user: any }>(`${this.API_URL}`, profileData)
      );

      this.updateUserInAuth(response.user);
      this._successMessage.set('Profil mis à jour avec succès');

    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      this._loading.set(false);
    }
  }

  //============ UPLOAD AVATAR ============

  async uploadAvatar(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await firstValueFrom(
      this.http.post<{ message: string; user: any }>(`${this.API_URL}/avatar`, formData)
    );

    this.updateUserInAuth(response.user);
  }

  //============ DELETE ACCOUNT ============

  async deleteAccount(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(
        this.http.delete(`${this.API_URL}`)
      );

      this.authService.logout();

    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      this._loading.set(false);
    }
  }

  //============ UTILITIES ============

  clearMessages(): void {
    this._error.set(null);
    this._successMessage.set(null);
  }

  private updateUserInAuth(user: any): void {
    this.authService.updateCurrentUser(user);
  }
}