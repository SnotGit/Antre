import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

//======= CHRONIQUES INTERFACES =======

export interface StoryReader {
  id: number;
  title: string;
  content: string;
  publishDate: string;
  likes: number;
  isliked: boolean;
  user: {
    id: number;
    username: string;
    avatar: string;
    description: string;
  };
}

export interface StoryCard {
  id: number;
  title: string;
  publishDate: string;
  user: {
    username: string;
    avatar: string;
  };
}


//======= EDIT =======

export interface EditStory {
  id: number;
  title: string;
  content: string;
}

//======= LISTS =======

export interface Draft {
  id: number;
  title: string;
  lastModified: string;
}

export interface Published {
  id: number;
  title: string;
  lastModified: string;
  likes: number;
}

//======= STATS =======

export interface UserStats {
  drafts: number;
  published: number;
  totalLikes: number;
}

//======= USER STORIES =======

export interface UserStories {
  id: number;
  title: string;
}


@Injectable({
  providedIn: 'root'
})
export class LoadService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/get`;

  //======= PUBLIC STORIES =======

  async getLatest(): Promise<StoryCard[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ stories: StoryCard[] }>(`${this.API_URL}/latest`)
      );
      return response.stories || [];
    } catch (error) {
      alert('Erreur lors du chargement des chroniques');
      throw error;
    }
  }

  async getStory(id: number): Promise<StoryReader> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ story: StoryReader }>(`${this.API_URL}/story/${id}`)
      );
      return response.story;
    } catch (error) {
      alert('Erreur lors du chargement de l\'histoire');
      throw error;
    }
  }

  async getStories(userId: number): Promise<UserStories[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ stories: UserStories[] }>(`${this.API_URL}/stories/${userId}`)
      );
      return response.stories || [];
    } catch (error) {
      alert('Erreur lors du chargement des histoires utilisateur');
      throw error;
    }
  }



  //======= PRIVATE STORIES =======

  async getStats(): Promise<UserStats> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ stats: UserStats }>(`${this.API_URL}/stats`)
      );
      return response.stats || { drafts: 0, published: 0, totalLikes: 0 };
    } catch (error) {
      alert('Erreur lors du chargement des statistiques');
      throw error;
    }
  }

  async getDrafts(): Promise<Draft[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ drafts: Draft[] }>(`${this.API_URL}/drafts`)
      );
      return response.drafts || [];
    } catch (error) {
      alert('Erreur lors du chargement des brouillons');
      throw error;
    }
  }

  async getPublished(): Promise<Published[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ published: Published[] }>(`${this.API_URL}/published`)
      );
      return response.published || [];
    } catch (error) {
      alert('Erreur lors du chargement des histoires publiées');
      throw error;
    }
  }

  async getDraftStory(id: number): Promise<EditStory> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ story: EditStory }>(`${this.API_URL}/draft-story/${id}`)
      );
      return response.story;
    } catch (error) {
      alert('Erreur lors du chargement du brouillon');
      throw error;
    }
  }

  async getPublishedStory(id: number): Promise<EditStory> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ story: EditStory }>(`${this.API_URL}/published-story/${id}`)
      );
      return response.story;
    } catch (error) {
      alert('Erreur lors du chargement de l\'histoire publiée');
      throw error;
    }
  }


}