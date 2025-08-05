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
  private readonly API_URL = `${environment.apiUrl}/chroniques`;

  //======= PUBLIC STORIES =======

  async getLatest(): Promise<StoryCard[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ stories: StoryCard[] }>(`${this.API_URL}/public/stories`)
      );
      return response.stories || [];
    } catch (error) {
      throw error;
    }
  }

  async getStory(id: number): Promise<StoryReader> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ story: StoryReader }>(`${this.API_URL}/public/story/${id}`)
      );
      return response.story;
    } catch (error) {
      throw error;
    }
  }

  async getStories(userId: number): Promise<UserStories[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ stories: UserStories[] }>(`${this.API_URL}/public/user/${userId}/stories`)
      );
      return response.stories || [];
    } catch (error) {
      throw error;
    }
  }

  //======= PRIVATE STORIES =======

  async getDrafts(): Promise<Draft[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ stories: Draft[] }>(`${this.API_URL}/private/drafts`)
      );
      return response.stories || [];
    } catch (error) {
      throw error;
    }
  }

  async getPublished(): Promise<Published[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ stories: Published[] }>(`${this.API_URL}/private/published`)
      );
      return response.stories || [];
    } catch (error) {
      throw error;
    }
  }

  async getDraftStory(id: number): Promise<EditStory> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ story: EditStory }>(`${this.API_URL}/private/draft/${id}`)
      );
      return response.story;
    } catch (error) {
      throw error;
    }
  }

  async getPublishedStory(id: number): Promise<EditStory> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ story: EditStory }>(`${this.API_URL}/private/published/${id}`)
      );
      return response.story;
    } catch (error) {
      throw error;
    }
  }
}