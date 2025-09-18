import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

export interface LikeCountResponse {
  storyId: number;
  likesCount: number;
}

export interface LikeStatusResponse {
  storyId: number;
  isLiked: boolean;
  canLike: boolean;
}

export interface LikeToggleResponse {
  liked: boolean;
  likesCount: number;
}

export interface LikedStory {
  storyId: number;
  title: string;
  publishDate: string;
  likedAt: string;
  user: {
    id: number;
    username: string;
    avatar: string;
  };
}

export interface LikedStoriesResponse {
  likedStories: LikedStory[];
}

@Injectable({
  providedIn: 'root'
})
export class LikeService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/user/likes`;

  //======= GET COUNT (PUBLIC) =======

  async getCount(storyId: number): Promise<LikeCountResponse> {
    try {
      return await firstValueFrom(
        this.http.get<LikeCountResponse>(`${this.API_URL}/story/${storyId}/count`)
      );
    } catch (error) {
      throw error;
    }
  }

  //======= GET STATUS (PRIVATE) =======

  async getStatus(storyId: number): Promise<LikeStatusResponse> {
    try {
      return await firstValueFrom(
        this.http.get<LikeStatusResponse>(`${this.API_URL}/story/${storyId}/status`)
      );
    } catch (error) {
      throw error;
    }
  }

  //======= TOGGLE LIKE (PRIVATE) =======

  async toggleLike(storyId: number): Promise<LikeToggleResponse> {
    try {
      return await firstValueFrom(
        this.http.post<LikeToggleResponse>(`${this.API_URL}/story/${storyId}/toggle`, {})
      );
    } catch (error) {
      throw error;
    }
  }

  //======= GET LIKED STORIES (PRIVATE) =======

  async getLikedStories(): Promise<LikedStoriesResponse> {
    try {
      return await firstValueFrom(
        this.http.get<LikedStoriesResponse>(`${this.API_URL}/liked-stories`)
      );
    } catch (error) {
      throw error;
    }
  }
}