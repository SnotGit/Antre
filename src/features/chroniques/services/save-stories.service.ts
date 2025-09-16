import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

//======= INTERFACES =======

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

  //======= HELPERS =======

  private async executeHttpRequest<T>(request: Promise<T>): Promise<T> {
    try {
      return await request;
    } catch (error) {
      throw error;
    }
  }

  private buildStoryUrl(endpoint: string, id?: number): string {
    const baseUrl = `${this.API_URL}/stories`;
    return id ? `${baseUrl}/${endpoint}/${id}` : `${baseUrl}/${endpoint}`;
  }

  //======= CREATE STORY =======

  async createStory(): Promise<number> {
    const response = await this.executeHttpRequest(
      firstValueFrom(
        this.http.post<StoryResponse>(this.buildStoryUrl('drafts'), {
          title: '',
          content: ''
        })
      )
    );
    return response.story.id;
  }

  //======= CREATE DRAFT FROM PUBLISHED =======

  async createDraftFromPublished(originalId: number, data: StoryFormData): Promise<number> {
    const response = await this.executeHttpRequest(
      firstValueFrom(
        this.http.post<StoryResponse>(this.buildStoryUrl('drafts'), {
          title: data.title,
          content: data.content,
          originalStoryId: originalId
        })
      )
    );
    return response.story.id;
  }

  //======= SAVE STORY =======

  async saveStory(id: number, data: StoryFormData): Promise<void> {
    await this.executeHttpRequest(
      firstValueFrom(
        this.http.put(this.buildStoryUrl('drafts', id), data)
      )
    );
  }

  //======= PUBLISH STORY =======

  async publishStory(id: number): Promise<void> {
    await this.executeHttpRequest(
      firstValueFrom(
        this.http.post(`${this.buildStoryUrl('drafts', id)}/publish`, {})
      )
    );
  }

  //======= UPDATE STORY =======

  async updateStory(id: number, data: StoryFormData): Promise<void> {
    await this.executeHttpRequest(
      firstValueFrom(
        this.http.put(this.buildStoryUrl('published', id), data)
      )
    );
  }

  //======= LOCAL STORAGE =======

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