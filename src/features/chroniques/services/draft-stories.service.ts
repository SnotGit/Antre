import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

export interface DraftStory {
  id: number;
  title: string;
  lastModified: string;
}

export interface EditStory {
  id: number;
  title: string;
  content: string;
}

export interface DraftStoriesResponse {
  stories: DraftStory[];
}

export interface DraftStoryResponse {
  story: EditStory;
}

@Injectable({
  providedIn: 'root'
})
export class DraftStoriesService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/chroniques`;

  //======= GET DRAFT STORIES =======

  async getDraftStories(): Promise<DraftStory[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<DraftStoriesResponse>(`${this.API_URL}/stories/drafts`)
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

  //======= GET SINGLE DRAFT STORY =======

  async getDraftStory(storyId: number): Promise<EditStory> {
    try {
      const response = await firstValueFrom(
        this.http.get<DraftStoryResponse>(`${this.API_URL}/stories/drafts/${storyId}`)
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