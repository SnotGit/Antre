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
}