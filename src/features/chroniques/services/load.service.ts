import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

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
    id: number;       
    username: string;
    avatar: string;
  };
}

export interface EditStory {
  id: number;
  title: string;
  content: string;
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

export interface UserStories {
  id: number;
  title: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoadService {

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/chroniques`;

  //======= DATE FORMATTING =======

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  //======= CHRONIQUES =======

  async getLatest(): Promise<StoryCard[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ stories: StoryCard[] }>(`${this.API_URL}/stories/latest`)
      );
   
      const stories = response.stories || [];
      
      return stories.map(story => ({
        ...story,
        publishDate: this.formatDate(story.publishDate)
      }));
    } catch (error) {
      throw error;
    }
  }

  //======= DRAFT LIST =======

  async getDraftStories(): Promise<DraftStory[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ stories: DraftStory[] }>(`${this.API_URL}/stories/drafts`)
      );
      
      const stories = response.stories || [];
      
      return stories.map(story => ({
        ...story,
        lastModified: this.formatDate(story.lastModified)
      }));
    } catch (error) {
      throw error;
    }
  }

  async getDraftStory(id: number): Promise<EditStory> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ story: EditStory }>(`${this.API_URL}/stories/drafts/${id}`)
      );
      return response.story;
    } catch (error) {
      throw error;
    }
  }

  //======= PUBLISHED LIST =======

  async getPublishedStories(): Promise<PublishedStory[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ stories: PublishedStory[] }>(`${this.API_URL}/stories/published`)
      );
      
      const stories = response.stories || [];
      
      return stories.map(story => ({
        ...story,
        lastModified: this.formatDate(story.lastModified)
      }));
    } catch (error) {
      throw error;
    }
  }

  async getPublishedStory(id: number): Promise<EditStory> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ story: EditStory }>(`${this.API_URL}/stories/published/${id}`)
      );
      return response.story;
    } catch (error) {
      throw error;
    }
  }

  //======= EDIT =======

  async getStoryForEdit(id: number): Promise<EditStory> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ story: EditStory }>(`${this.API_URL}/stories/edit/${id}`)
      );
      return response.story;
    } catch (error) {
      throw error;
    }
  }

  //======= READER =======

  async getStory(id: number): Promise<StoryReader> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ story: StoryReader }>(`${this.API_URL}/reader/${id}`)
      );
      
      return {
        ...response.story,
        publishDate: this.formatDate(response.story.publishDate)
      };
    } catch (error) {
      throw error;
    }
  }

  async getStories(userId: number): Promise<UserStories[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ stories: UserStories[] }>(`${this.API_URL}/user/${userId}/stories`)
      );
      return response.stories || [];
    } catch (error) {
      throw error;
    }
  }
}