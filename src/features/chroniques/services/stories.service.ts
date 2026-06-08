import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

//========== INTERFACES ==========//

export interface StoryBase {
  id: number;
  title: string;
  lastModified: string;
}

export interface DraftStory extends StoryBase {}

export interface PublishedStory extends StoryBase {
  likes: number;
}

export interface EditStory {
  id: number;
  title: string;
  content: string;
  originalStoryId: number | null;
}

export interface StoryFormData {
  title: string;
  content: string;
  originalStoryId?: number;
}

export interface StoriesResponse<T> {
  stories: T[];
}

export interface StoryResponse {
  story: EditStory;
}

@Injectable({
  providedIn: 'root'
})
export class StoriesService {

  //========== INJECTIONS ==========//
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/user/stories`;

  //========== GET STORIES ==========//

  async getDrafts(): Promise<DraftStory[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<StoriesResponse<DraftStory>>(`${this.API_URL}/drafts`)
      );
      return (response.stories || []).map(s => ({ ...s, lastModified: this.formatDate(s.lastModified) }));
    } catch (error) {
      throw error;
    }
  }

  async getPublished(): Promise<PublishedStory[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<StoriesResponse<PublishedStory>>(`${this.API_URL}/published`)
      );
      return (response.stories || []).map(s => ({ ...s, lastModified: this.formatDate(s.lastModified) }));
    } catch (error) {
      throw error;
    }
  }

  async getStory(id: number, mode: 'draft' | 'published'): Promise<EditStory> {
    try {
      const response = await firstValueFrom(
        this.http.get<StoryResponse>(`${this.API_URL}/${mode}/${id}`)
      );
      return response.story;
    } catch (error) {
      throw error;
    }
  }

  //========== WRITE OPERATIONS ==========//

  async createStory(): Promise<number> {
    const response = await firstValueFrom(
      this.http.post<StoryResponse>(`${this.API_URL}/drafts`, { title: '', content: '' })
    );
    return response.story.id;
  }

  async saveStory(id: number, data: StoryFormData): Promise<void> {
    await firstValueFrom(
      this.http.put(`${this.API_URL}/drafts/${id}`, data)
    );
  }

  async publishStory(id: number): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.API_URL}/drafts/${id}/publish`, {})
    );
  }

  async deleteStory(id: number): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.API_URL}/${id}`)
    );
  }

  //========== HELPER ==========//

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
