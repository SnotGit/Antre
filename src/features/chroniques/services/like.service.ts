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
  private readonly API_URL = `${environment.apiUrl}/like`;

  //======= TOGGLE LIKE =======

  async toggle(storyId: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.API_URL}/${storyId}`, {})
      );
    } catch (error) {
      alert('Erreur lors du like');
      throw error;
    }
  }
}