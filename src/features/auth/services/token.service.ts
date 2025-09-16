import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { User } from './login.service';

export interface TokenValidationResponse {
  message: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/auth`;

  //======= VALIDATE TOKEN =======

  async validateToken(): Promise<TokenValidationResponse> {
    try {
      return await firstValueFrom(
        this.http.get<TokenValidationResponse>(`${this.API_URL}/validate`)
      );
    } catch (error) {
      throw error;
    }
  }
}