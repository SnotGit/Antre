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
    username: string;
    avatar: string;
  };
}

export interface EditStory {
  id: number;
  title: string;
  content: string;
}

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

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  async getLatest(): Promise<StoryCard[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ stories: StoryCard[] }>(`${this.API_URL}/public/stories`)
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

  async getStory(id: number): Promise<StoryReader> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ story: StoryReader }>(`${this.API_URL}/public/story/${id}`)
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
        this.http.get<{ stories: UserStories[] }>(`${this.API_URL}/public/user/${userId}/stories`)
      );
      return response.stories || [];
    } catch (error) {
      throw error;
    }
  }

  async getDrafts(): Promise<Draft[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ drafts: Draft[] }>(`${this.API_URL}/private/drafts`)
      );
      
      const drafts = response.drafts || [];
      
      return drafts.map(draft => ({
        ...draft,
        lastModified: this.formatDate(draft.lastModified)
      }));
    } catch (error) {
      throw error;
    }
  }

  async getPublished(): Promise<Published[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ published: Published[] }>(`${this.API_URL}/private/published`)
      );
      
      const published = response.published || [];
      
      return published.map(story => ({
        ...story,
        lastModified: this.formatDate(story.lastModified)
      }));
    } catch (error) {
      throw error;
    }
  }

  async getStoryForEdit(id: number): Promise<EditStory> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ story: EditStory }>(`${this.API_URL}/private/story/${id}`)
      );
      return response.story;
    } catch (error) {
      throw error;
    }
  }
}