// src/app/services/story.service.ts
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

// Réponse de getStoryById
export interface StoryByIdResponse {
  message: string;
  story: StoryFromAPI;
}

// Réponse de getAllStories
export interface AllStoriesResponse {
  message: string;
  stories: StoryFromAPI[];
  count: number;
}

// Réponse du système de likes
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

  // Récupérer une histoire par ID (route publique)
  getStoryById(id: number): Observable<StoryByIdResponse> {
    return this.http.get<StoryByIdResponse>(`${this.API_URL}/stories/${id}`);
  }

  // Récupérer toutes les histoires (route publique)
  getAllStories(): Observable<AllStoriesResponse> {
    return this.http.get<AllStoriesResponse>(`${this.API_URL}/stories`);
  }

  // Récupérer toutes les histoires publiées d'un auteur (route publique)
  getStoriesByAuthor(authorId: number): Observable<AllStoriesResponse> {
    return this.http.get<AllStoriesResponse>(`${this.API_URL}/stories/user/${authorId}`);
  }

  // Toggle like sur une histoire (authentifié)
  toggleLike(storyId: number, token: string): Observable<LikeResponse> {
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.post<LikeResponse>(`${this.API_URL}/stories/${storyId}/like`, {}, { headers });
  }

  // Vérifier si l'utilisateur a liké une histoire (authentifié)
  checkIfLiked(storyId: number, token: string): Observable<{isLiked: boolean, likesCount: number}> {
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.get<{isLiked: boolean, likesCount: number}>(`${this.API_URL}/stories/${storyId}/like-status`, { headers });
  }
}