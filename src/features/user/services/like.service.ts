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

export interface ReceivedLike {
  storyId: number;
  title: string;
  publishDate: string;
  likesCount: number;
  lastLikedAt: string;
}

export interface ReceivedLikesListResponse {
  receivedLikes: ReceivedLike[];
}

export interface ReceivedLikesCountResponse {
  receivedLikes: number;
}

export interface PostedLikesCountResponse {
  postedLikes: number;
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

  //======= GET POSTED LIKES LIST (PRIVATE) =======

  async getPostedLikesList(): Promise<LikedStoriesResponse> {
    try {
      return await firstValueFrom(
        this.http.get<LikedStoriesResponse>(`${this.API_URL}/liked-stories`)
      );
    } catch (error) {
      throw error;
    }
  }

  //======= GET RECEIVED LIKES COUNT (PRIVATE) =======

  async getReceivedLikesCount(): Promise<ReceivedLikesCountResponse> {
    try {
      return await firstValueFrom(
        this.http.get<ReceivedLikesCountResponse>(`${this.API_URL}/received`)
      );
    } catch (error) {
      throw error;
    }
  }

  //======= GET POSTED LIKES COUNT (PRIVATE) =======

  async getPostedLikesCount(): Promise<PostedLikesCountResponse> {
    try {
      return await firstValueFrom(
        this.http.get<PostedLikesCountResponse>(`${this.API_URL}/posted`)
      );
    } catch (error) {
      throw error;
    }
  }

  //======= GET RECEIVED LIKES LIST (PRIVATE) =======

  async getReceivedLikesList(): Promise<ReceivedLikesListResponse> {
    try {
      return await firstValueFrom(
        this.http.get<ReceivedLikesListResponse>(`${this.API_URL}/received-likes`)
      );
    } catch (error) {
      throw error;
    }
  }
}