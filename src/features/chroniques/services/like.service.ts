import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

interface LikeResponse {
  liked: boolean;
  likesCount: number;
}

interface LikeStatus {
  storyId: number;
  likesCount: number;
  isLiked: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LikeService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}`;

  //======= STATUS =======

  async getStatus(storyId: number): Promise<{ likes: number; isliked: boolean }> {
    try {
      const response = await firstValueFrom(
        this.http.get<LikeStatus>(`${this.API_URL}/user/likes/story/${storyId}/status`)
      );
      
      return {
        likes: response.likesCount,
        isliked: response.isLiked
      };
    } catch (error) {
      return { likes: 0, isliked: false };
    }
  }

  //======= TOGGLE LIKE =======

  async toggle(storyId: number): Promise<LikeResponse> {
    try {
      return await firstValueFrom(
        this.http.put<LikeResponse>(`${this.API_URL}/chroniques/reader/${storyId}/like`, {})
      );
    } catch (error) {
      throw error;
    }
  }
}