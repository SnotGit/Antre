import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

export interface UpdateEmailRequest {
  newEmail: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface CredentialsResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class CredentialsService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/user/credentials`;

  //======= SIGNALS =======

  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _success = signal<string | null>(null);

  loading = this._loading.asReadonly();
  error = this._error.asReadonly();
  success = this._success.asReadonly();

  //======= UPDATE EMAIL =======

  async updateEmail(newEmail: string): Promise<CredentialsResponse> {
    const request: UpdateEmailRequest = { newEmail };

    this._loading.set(true);
    this.clearMessages();

    try {
      const response = await firstValueFrom(
        this.http.put<CredentialsResponse>(`${this.API_URL}/email`, request)
      );

      this._success.set(response.message);
      return response;

    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this._error.set(error.error?.error || 'Erreur lors de la mise à jour de l\'email');
      } else {
        this._error.set('Erreur lors de la mise à jour de l\'email');
      }
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  //======= CHANGE PASSWORD =======

  async changePassword(currentPassword: string, newPassword: string): Promise<CredentialsResponse> {
    const request: ChangePasswordRequest = { currentPassword, newPassword };

    this._loading.set(true);
    this.clearMessages();

    try {
      const response = await firstValueFrom(
        this.http.put<CredentialsResponse>(`${this.API_URL}/password`, request)
      );

      this._success.set(response.message);
      return response;

    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this._error.set(error.error?.error || 'Erreur lors du changement de mot de passe');
      } else {
        this._error.set('Erreur lors du changement de mot de passe');
      }
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  //======= UTILITIES =======

  clearMessages(): void {
    this._error.set(null);
    this._success.set(null);
  }
}