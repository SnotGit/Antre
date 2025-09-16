import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { User } from './login.service';

export interface TokenValidationResponse {
  message: string;
  user: User;
}

export interface TokenInfo {
  isValid: boolean;
  user?: User;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'auth_token';

  //======= TOKEN STORAGE =======

  hasToken(): boolean {
    return this.getToken() !== null;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  //======= TOKEN VALIDATION =======

  async getTokenInfo(): Promise<TokenInfo> {
    const token = this.getToken();
    
    if (!token) {
      return {
        isValid: false,
        error: 'Token manquant'
      };
    }

    try {
      const response = await this.validateToken();
      return {
        isValid: true,
        user: response.user
      };
    } catch (error: any) {
      return this.handleValidationError(error);
    }
  }

  //======= API VALIDATION =======

  async validateToken(): Promise<TokenValidationResponse> {
    try {
      return await firstValueFrom(
        this.http.get<TokenValidationResponse>(`${this.API_URL}/validate`)
      );
    } catch (error) {
      throw error;
    }
  }

  //======= ERROR HANDLING =======

  private handleValidationError(error: any): TokenInfo {
    if (error.status === 401) {
      return {
        isValid: false,
        error: 'Token manquant'
      };
    }
    
    if (error.status === 403) {
      return {
        isValid: false,
        error: 'Token invalide'
      };
    }
    
    if (error.status === 0 || !navigator.onLine) {
      return {
        isValid: false,
        error: 'Erreur de connexion'
      };
    }
    
    return {
      isValid: false,
      error: 'Erreur de validation du token'
    };
  }
}