import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

//======= INTERFACES =======

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

  //======= HELPERS FACTORISÉS =======

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

  private scheduleLocalSave(callback: () => void): void {
    if (this.saveLocalTimeout) {
      clearTimeout(this.saveLocalTimeout);
    }

    this.saveLocalTimeout = window.setTimeout(callback, 500);
  }

  //======= CREATE =======

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

  //======= SAVE DATABASE =======

  async save(id: number, data: StoryFormData): Promise<void> {
    await this.executeHttpRequest(
      firstValueFrom(
        this.http.put(this.buildStoryUrl('drafts', id), data)
      )
    );
  }

  //======= PUBLISH =======

  async publish(id: number): Promise<void> {
    await this.executeHttpRequest(
      firstValueFrom(
        this.http.post(`${this.buildStoryUrl('drafts', id)}/publish`, {})
      )
    );
  }

  //======= UPDATE =======

  async update(id: number, data: StoryFormData): Promise<void> {
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
}