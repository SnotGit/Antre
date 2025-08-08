import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService, User } from './auth.service';

export interface EmailData {
  email: string;
}

export interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class CredentialsService {

  //============ INJECTIONS ============

  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly API_URL = `${environment.apiUrl}/user/credentials`;

  //============ SIGNALS ============

  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _success = signal<string | null>(null);

  loading = this._loading.asReadonly();
  error = this._error.asReadonly();
  success = this._success.asReadonly();

  //============ EMAIL METHODS ============

  async updateEmail(email: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    this._success.set(null);

    try {
      const response = await firstValueFrom(
        this.http.put<{ message: string; user: User }>(`${this.API_URL}/email`, {
          email: email.trim()
        })
      );

      this.authService.updateCurrentUser(response.user);
      this._success.set('Email mis à jour avec succès');

    } catch (error: any) {
      this._error.set(error?.error?.message || 'Erreur lors de la mise à jour de l\'email');
    } finally {
      this._loading.set(false);
    }
  }

  //============ PASSWORD METHODS ============

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    this._success.set(null);

    try {
      await firstValueFrom(
        this.http.put<{ message: string }>(`${this.API_URL}/password`, {
          currentPassword,
          newPassword
        })
      );

      this._success.set('Mot de passe modifié avec succès');

    } catch (error: any) {
      this._error.set(error?.error?.message || 'Erreur lors du changement de mot de passe');
    } finally {
      this._loading.set(false);
    }
  }

  //============ UTILITIES ============

  clearMessages(): void {
    this._error.set(null);
    this._success.set(null);
  }
}