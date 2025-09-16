import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

export interface User {
  id: number;
  username: string;
  email: string;
  description?: string;
  avatar?: string;
  role: 'admin' | 'user';
  playerId?: string;
  playerDays?: number;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/auth`;

  //======= LOGIN =======

  async login(email: string, password: string): Promise<LoginResponse> {
    const request: LoginRequest = { email, password };

    try {
      return await firstValueFrom(
        this.http.post<LoginResponse>(`${this.API_URL}/login`, request)
      );
    } catch (error) {
      throw error;
    }
  }
}