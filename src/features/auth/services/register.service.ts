import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { User } from '@features/auth';

//======= TYPES =======

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  description?: string;
}

export interface RegisterResponse {
  message: string;
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class RegisterService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/auth`;

  //======= HELPERS =======

  private async executeHttpRequest<T>(request: Promise<T>): Promise<T> {
    try {
      return await request;
    } catch (error) {
      this.handleRegisterError(error);
      throw error;
    }
  }

  //======= REGISTER =======

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    return this.executeHttpRequest(
      firstValueFrom(
        this.http.post<RegisterResponse>(`${this.API_URL}/register`, userData)
      )
    );
  }

  //======= ERROR HANDLING =======

  private handleRegisterError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 409:
          throw new Error('Ce nom d\'utilisateur ou email est déjà utilisé');
        case 422:
          throw new Error('Données d\'inscription invalides');
        case 400:
          throw new Error('Mot de passe trop faible ou email invalide');
        case 429:
          throw new Error('Trop de tentatives d\'inscription. Réessayez plus tard');
        case 500:
          throw new Error('Erreur serveur temporaire');
        case 0:
          throw new Error('Pas de connexion internet');
        default:
          throw new Error(error.error?.message || 'Erreur lors de l\'inscription');
      }
    } else {
      throw new Error('Erreur inattendue lors de l\'inscription');
    }
  }
}