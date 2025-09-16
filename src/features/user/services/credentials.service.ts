import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  //======= UPDATE EMAIL =======

  async updateEmail(newEmail: string): Promise<CredentialsResponse> {
    const request: UpdateEmailRequest = { newEmail };

    try {
      return await firstValueFrom(
        this.http.put<CredentialsResponse>(`${this.API_URL}/email`, request)
      );
    } catch (error) {
      throw error;
    }
  }

  //======= CHANGE PASSWORD =======

  async changePassword(currentPassword: string, newPassword: string): Promise<CredentialsResponse> {
    const request: ChangePasswordRequest = { currentPassword, newPassword };

    try {
      return await firstValueFrom(
        this.http.put<CredentialsResponse>(`${this.API_URL}/password`, request)
      );
    } catch (error) {
      throw error;
    }
  }
}