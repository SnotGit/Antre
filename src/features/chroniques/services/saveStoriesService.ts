import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

export interface StoryFormData {
  title: string;
  content: string;
  originalStoryId?: number;
}

export interface StoryResponse {
  story: {
    id: number;
    title: string;
    content: string;
  };
}

export interface SuccessResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class SaveStoriesService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/chroniques`;

  //======= DEBOUNCE =======

  private saveLocalTimeout: number | undefined;

  //======= CREATE DRAFT =======

  async createDraft(data?: StoryFormData): Promise<number> {
    const requestData = data || { title: '', content: '' };
    
    try {
      const response = await firstValueFrom(
        this.http.post<StoryResponse>(`${this.API_URL}/stories/drafts`, requestData)
      );
      
      return response.story.id;
    } catch (error) {
      throw error;
    }
  }

  //======= SAVE DRAFT =======

  async saveDraft(storyId: number, data: StoryFormData): Promise<void> {
    try {
      await firstValueFrom(
        this.http.put<SuccessResponse>(`${this.API_URL}/stories/drafts/${storyId}`, data)
      );
    } catch (error) {
      throw error;
    }
  }

  //======= PUBLISH STORY =======

  async publishStory(storyId: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<SuccessResponse>(`${this.API_URL}/stories/drafts/${storyId}/publish`, {})
      );
    } catch (error) {
      throw error;
    }
  }

  //======= UPDATE STORY =======

  async updateStory(storyId: number, data: StoryFormData): Promise<void> {
    try {
      await firstValueFrom(
        this.http.put<SuccessResponse>(`${this.API_URL}/stories/published/${storyId}`, data)
      );
    } catch (error) {
      throw error;
    }
  }

  //======= LOCAL STORAGE HELPERS =======

  saveLocal(key: string, data: StoryFormData): void {
    this.scheduleLocalSave(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        console.error('Erreur lors de la sauvegarde locale:', error);
      }
    });
  }

  restoreLocal(key: string): StoryFormData | null {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Erreur lors de la restauration locale:', error);
      return null;
    }
  }

  clearLocal(key: string): void {
    localStorage.removeItem(key);
  }

  //======= PRIVATE HELPERS =======

  private scheduleLocalSave(callback: () => void): void {
    if (this.saveLocalTimeout) {
      clearTimeout(this.saveLocalTimeout);
    }

    this.saveLocalTimeout = window.setTimeout(callback, 500);
  }
}