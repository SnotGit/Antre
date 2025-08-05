import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LikeService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/chroniques`;

  //======= TOGGLE LIKE =======

  async toggle(storyId: number): Promise<{ liked: boolean, likesCount: number }> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ liked: boolean, likesCount: number }>
        (`${this.API_URL}/public/story/${storyId}/like`, {})
      );
      return response;
    } catch (error) {
      alert('Erreur lors du like');
      throw error;
    }
  }
}