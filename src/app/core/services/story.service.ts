import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface StoryFromAPI {
  id: number;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  slug?: string;
  user?: {
    id: number;
    username: string;
    description?: string;
    avatar?: string;
  };
}

interface StoryResponse {
  message: string;
  story: StoryFromAPI;
}

interface AllStoriesResponse {
  message: string;
  stories: StoryFromAPI[];
  count: number;
}

interface LikeResponse {
  message: string;
  isLiked: boolean;
  likesCount: number;
}

interface LikeStatusResponse {
  isLiked: boolean;
  likesCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class StoryService {
  private readonly API_URL = 'http://localhost:3000/api';
  private http = inject(HttpClient);

  //============ LECTURE HISTOIRES ============
  async getStoryBySlug(slug: string): Promise<StoryResponse> {
    return firstValueFrom(this.http.get<StoryResponse>(`${this.API_URL}/stories/slug/${slug}`));
  }

  async getStoryById(id: number): Promise<StoryResponse> {
    return firstValueFrom(this.http.get<StoryResponse>(`${this.API_URL}/stories/${id}`));
  }

  async getStoriesByUser(userId: number): Promise<AllStoriesResponse> {
    return firstValueFrom(this.http.get<AllStoriesResponse>(`${this.API_URL}/stories/user/${userId}`));
  }

  //============ LIKES ============
  async toggleLike(storyId: number, token: string): Promise<LikeResponse> {
    const headers = { 'Authorization': `Bearer ${token}` };
    return firstValueFrom(
      this.http.post<LikeResponse>(`${this.API_URL}/stories/${storyId}/like`, {}, { headers })
    );
  }

  async checkIfLiked(storyId: number, token: string): Promise<LikeStatusResponse> {
    const headers = { 'Authorization': `Bearer ${token}` };
    return firstValueFrom(
      this.http.get<LikeStatusResponse>(`${this.API_URL}/stories/${storyId}/like-status`, { headers })
    );
  }
}