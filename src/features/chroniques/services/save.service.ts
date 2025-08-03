import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

//======= INTERFACE =======

interface StoryData {
  title: string;
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class SaveService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000/api/private-stories';

  //======= DEBOUNCE =======

  private saveTimeout: number | undefined;
  private saveLocalTimeout: number | undefined;

  //======= CREATE =======

  async createStory(): Promise<number> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ story: { id: number } }>(`${this.API_URL}/createStory`, {})
      );
      return response.story.id;
    } catch (error) {
      alert('Erreur lors de la création de l\'histoire');
      throw error;
    }
  }

  //======= SAVE BDD =======

  save(id: number, data: StoryData): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = window.setTimeout(async () => {
      try {
        await firstValueFrom(
          this.http.put(`${this.API_URL}/saveStory/${id}`, data)
        );
      } catch (error) {
        alert('Erreur lors de la sauvegarde');
      }
    }, 2000);
  }

  //======= SAVE LOCAL =======

  saveLocal(key: string, data: StoryData): void {
    if (this.saveLocalTimeout) {
      clearTimeout(this.saveLocalTimeout);
    }

    this.saveLocalTimeout = window.setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        alert('Erreur lors de la sauvegarde locale');
      }
    }, 2000);
  }

  //======= RESTORE LOCAL =======

  restoreLocal(key: string): StoryData | null {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
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
        this.http.post(`${this.API_URL}/publishStory/${id}`, {})
      );
    } catch (error) {
      alert('Erreur lors de la publication');
      throw error;
    }
  }

  //======= UPDATE =======

  async update(id: number, data: StoryData): Promise<void> {
    try {
      await firstValueFrom(
        this.http.put(`${this.API_URL}/updateStory/${id}`, data)
      );
    } catch (error) {
      alert('Erreur lors de la mise à jour');
      throw error;
    }
  }
}