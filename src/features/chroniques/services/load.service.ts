import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

//======= INTERFACES =======

export interface StoryData {
  id: number;
  title: string;
  content: string;
}

export interface UserStats {
  drafts: number;
  published: number;
}

export interface PublicStory {
  id: number;
  title: string;
  publishDate: string;
  likes: number;
  isliked: boolean;
  content?: string;
  user?: {
    id: number;
    username: string;
    avatar: string;
    description: string;
  };
}

export interface DraftStory {
  id: number;
  title: string;
  lastModified: string;
}

export interface PublishedStory {
  id: number;
  title: string;
  lastModified: string;
  likes: number;
}

interface StoryResponse {
  story: StoryData;
}

interface StatsResponse {
  stats: UserStats;
}

@Injectable({
  providedIn: 'root'
})
export class LoadService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/get`;

  //======= GET STORY =======

  async getStory(id: number): Promise<StoryData> {
    try {
      const response = await firstValueFrom(
        this.http.get<StoryResponse>(`${this.API_URL}/story/${id}`)
      );
      return response.story;
    } catch (error) {
      alert('Erreur lors du chargement de l\'histoire');
      throw error;
    }
  }

  //======= GET STATS =======

  async getStats(): Promise<UserStats> {
    try {
      const response = await firstValueFrom(
        this.http.get<StatsResponse>(`${this.API_URL}/stats`)
      );
      return response.stats || { drafts: 0, published: 0 };
    } catch (error) {
      alert('Erreur lors du chargement des statistiques');
      throw error;
    }
  }

  //======= GET LATEST USER STORIES =======

  async getLatestUserStories(): Promise<PublicStory[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ stories: PublicStory[] }>(`${this.API_URL}/latest-stories`)
      );
      return response.stories || [];
    } catch (error) {
      alert('Erreur lors du chargement des chroniques');
      throw error;
    }
  }

  //======= GET USER STORIES =======

  async getUserStories(userId: number): Promise<PublicStory[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ stories: PublicStory[] }>(`${this.API_URL}/user-stories/${userId}`)
      );
      return response.stories || [];
    } catch (error) {
      alert('Erreur lors du chargement des histoires utilisateur');
      throw error;
    }
  }

  //======= GET DRAFTS =======

  async getDrafts(): Promise<DraftStory[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ drafts: DraftStory[] }>(`${this.API_URL}/drafts`)
      );
      return response.drafts || [];
    } catch (error) {
      alert('Erreur lors du chargement des brouillons');
      throw error;
    }
  }

  //======= GET PUBLISHED =======

  async getPublished(): Promise<PublishedStory[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ published: PublishedStory[] }>(`${this.API_URL}/published`)
      );
      return response.published || [];
    } catch (error) {
      alert('Erreur lors du chargement des histoires publiées');
      throw error;
    }
  }
}