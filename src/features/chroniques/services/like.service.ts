import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

interface LikeResponse {
  liked: boolean;
  likesCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class LikeService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/chroniques`;

  //======= TOGGLE LIKE =======

  async toggle(storyId: number): Promise<LikeResponse> {
    try {
      return await firstValueFrom(
        this.http.put<LikeResponse>(`${this.API_URL}/reader/${storyId}/like`, {})
      );
    } catch (error) {
      throw error;
    }
  }
}