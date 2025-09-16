import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { User } from '@features/auth/services/loginService';

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
  private readonly API_URL = `${environment.apiUrl}/user`;

  //======= REGISTER =======

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    try {
      return await firstValueFrom(
        this.http.post<RegisterResponse>(`${this.API_URL}/register`, userData)
      );
    } catch (error) {
      throw error;
    }
  }
}