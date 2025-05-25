// src/app/services/story.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StoryFromAPI {
  id: number;
  title: string;
  content: string;
  status: string;
  views: number;
  wordCount: number;
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

// Réponse de getStoryById - d'après votre storyController.js ligne 47
export interface StoryByIdResponse {
  message: string;
  story: StoryFromAPI;
}

// Réponse de getAllStories - d'après votre storyController.js ligne 24
export interface AllStoriesResponse {
  message: string;
  stories: StoryFromAPI[];
  count: number;
}

// Réponse d'incrementViews - d'après votre chroniquesController.js ligne 125
export interface ViewsResponse {
  message: string;
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

  // Incrémenter les vues d'une histoire
  incrementViews(id: number): Observable<ViewsResponse> {
    return this.http.post<ViewsResponse>(`${this.API_URL}/chroniques/${id}/view`, {});
  }

  // Récupérer toutes les histoires (route publique)
  getAllStories(): Observable<AllStoriesResponse> {
    return this.http.get<AllStoriesResponse>(`${this.API_URL}/stories`);
  }

  // Routes authentifiées (pour plus tard)
  // publishStory(id: number): Observable<any> {
  //   return this.http.put(`${this.API_URL}/chroniques/${id}/publish`, {});
  // }

  // deleteStory(id: number): Observable<any> {
  //   return this.http.delete(`${this.API_URL}/stories/${id}`);
  // }
}