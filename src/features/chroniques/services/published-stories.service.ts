import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

export interface PublishedStory {
  id: number;
  title: string;
  lastModified: string;
  likes: number;
}

export interface EditStory {
  id: number;
  title: string;
  content: string;
}

export interface PublishedStoriesResponse {
  stories: PublishedStory[];
}

export interface PublishedStoryResponse {
  story: EditStory;
}

@Injectable({
  providedIn: 'root'
})
export class PublishedStoriesService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/chroniques`;

  //======= GET PUBLISHED STORIES =======

  async getPublishedStories(): Promise<PublishedStory[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<PublishedStoriesResponse>(`${this.API_URL}/stories/published`)
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

  //======= GET SINGLE PUBLISHED STORY =======

  async getPublishedStory(storyId: number): Promise<EditStory> {
    try {
      const response = await firstValueFrom(
        this.http.get<PublishedStoryResponse>(`${this.API_URL}/stories/published/${storyId}`)
      );
      
      return response.story;
    } catch (error) {
      throw error;
    }
  }

  //======= HELPER =======

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}