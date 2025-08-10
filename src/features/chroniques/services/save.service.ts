import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

//======= INTERFACE =======

export interface StoryFormData {
  title: string;
  content: string;
}

interface StoryResponse {
  story: {
    id: number;
    title: string;
    content: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SaveService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/chroniques`;

  //======= DEBOUNCE =======

  private saveLocalTimeout: number | undefined;

  //======= CREATE =======

  async createStory(): Promise<number> {
    try {
      const response = await firstValueFrom(
        this.http.post<StoryResponse>(`${this.API_URL}/stories/drafts`, {
          title: '',
          content: ''
        })
      );
      return response.story.id;
    } catch (error) {
      throw error;
    }
  }

  //======= CREATE DRAFT FROM PUBLISHED =======

  async createDraftFromPublished(originalId: number, data: StoryFormData): Promise<number> {
    try {
      const response = await firstValueFrom(
        this.http.post<StoryResponse>(`${this.API_URL}/stories/drafts`, {
          title: data.title,
          content: data.content,
          originalStoryId: originalId
        })
      );
      return response.story.id;
    } catch (error) {
      throw error;
    }
  }

  //======= SAVE DATABASE =======

  async save(id: number, data: StoryFormData): Promise<void> {
    try {
      await firstValueFrom(
        this.http.put(`${this.API_URL}/stories/drafts/${id}`, data)
      );
    } catch (error) {
      throw error;
    }
  }

  //======= SAVE LOCAL =======

  saveLocal(key: string, data: StoryFormData): void {
    if (this.saveLocalTimeout) {
      clearTimeout(this.saveLocalTimeout);
    }

    this.saveLocalTimeout = window.setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        console.error('Erreur lors de la sauvegarde locale:', error);
      }
    }, 500);
  }

  //======= RESTORE LOCAL =======

  restoreLocal(key: string): StoryFormData | null {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Erreur lors de la restauration locale:', error);
      return null;
    }
  }

  //======= CLEAR LOCAL =======

  clearLocal(key: string): void {
    localStorage.removeItem(key);
  }

  //======= PUBLISH =======

  async publish(id: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.API_URL}/stories/drafts/${id}/publish`, {})
      );
    } catch (error) {
      throw error;
    }
  }

  //======= UPDATE =======

  async update(id: number, data: StoryFormData): Promise<void> {
    try {
      await firstValueFrom(
        this.http.put(`${this.API_URL}/stories/published/${id}`, data)
      );
    } catch (error) {
      throw error;
    }
  }
}