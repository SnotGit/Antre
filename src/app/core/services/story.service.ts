import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StoryFromAPI {
  id: number;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  user?: {
    id: number;
    username: string;
    description?: string;
    avatar?: string;
  };
}

export interface StoryByIdResponse {
  message: string;
  story: StoryFromAPI;
}

export interface AllStoriesResponse {
  message: string;
  stories: StoryFromAPI[];
  count: number;
}

export interface LikeResponse {
  message: string;
  isLiked: boolean;
  likesCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class StoryService {
  private readonly API_URL = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getStoryById(id: number): Observable<StoryByIdResponse> {
    return this.http.get<StoryByIdResponse>(`${this.API_URL}/stories/${id}`);
  }

  getAllStories(): Observable<AllStoriesResponse> {
    return this.http.get<AllStoriesResponse>(`${this.API_URL}/stories`);
  }

  getStoriesByAuthor(authorId: number): Observable<AllStoriesResponse> {
    return this.http.get<AllStoriesResponse>(`${this.API_URL}/stories/user/${authorId}`);
  }

  toggleLike(storyId: number, token: string): Observable<LikeResponse> {
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.post<LikeResponse>(`${this.API_URL}/stories/${storyId}/like`, {}, { headers });
  }

  checkIfLiked(storyId: number, token: string): Observable<{isLiked: boolean, likesCount: number}> {
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.get<{isLiked: boolean, likesCount: number}>(`${this.API_URL}/stories/${storyId}/like-status`, { headers });
  }
}