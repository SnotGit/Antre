import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

//============ BUSINESS INTERFACES ============

interface StoryData {
  id: number;
  title: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED';
  lastModified: string;
  likes?: number;
}



interface UserStats {
  drafts: number;
  published: number;
  totalLikes: number;
}

//============ API RESPONSES ============

interface StoryResponse {
  message: string;
  story: StoryData;
  originalStoryId?: number;
}

interface TitleResolution {
  id: number;
  status: 'DRAFT' | 'PUBLISHED';
}

@Injectable({
  providedIn: 'root'
})
export class PrivateStoriesService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000/api/private-stories';

  //============ BUSINESS STATE ============

  private _drafts = signal<StoryData[]>([]);
  private _published = signal<StoryData[]>([]);
  private _stats = signal<UserStats>({ drafts: 0, published: 0, totalLikes: 0 });

  readonly drafts = this._drafts.asReadonly();
  readonly published = this._published.asReadonly();
  readonly stats = this._stats.asReadonly();

  //============ INITIALISATION ============

  async loadStories(): Promise<void> {
    await Promise.all([
      this.getDrafts(),
      this.getPublished(), 
      this.getStats()
    ]);
  }

  //============ RESOLUTION ============

  async resolveTitle(title: string): Promise<TitleResolution | null> {
    try {
      return await firstValueFrom(
        this.http.get<TitleResolution>(`${this.API_URL}/resolve/${encodeURIComponent(title)}`)
      );
    } catch {
      return null;
    }
  }

  //============ RETRIEVAL ============

  async getStory(id: number): Promise<StoryResponse | null> {
    try {
      return await firstValueFrom(
        this.http.get<StoryResponse>(`${this.API_URL}/edit/${id}`)
      );
    } catch {
      return null;
    }
  }

  //============ SAVE ============

  async saveDraft(data: { title: string; content: string }, id?: number): Promise<StoryResponse> {
    const response = id 
      ? await firstValueFrom(this.http.put<StoryResponse>(`${this.API_URL}/draft/${id}`, data))
      : await firstValueFrom(this.http.post<StoryResponse>(`${this.API_URL}/draft`, data));
    
    await this.refreshData();
    return response;
  }

  //============ PUBLICATION ============

  async publishStory(id: number): Promise<void> {
    await firstValueFrom(this.http.post(`${this.API_URL}/publish/${id}`, {}));
    await this.refreshData();
  }

  async updatePublishedStory(draftId: number, originalId: number): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.API_URL}/update/${draftId}`, { originalStoryId: originalId })
    );
    await this.refreshData();
  }

  //============ DELETION ============

  async deleteStory(id: number): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.API_URL}/story/${id}`));
    await this.refreshData();
  }

  //============ LIKES ============

  async toggleLike(storyId: number): Promise<{ liked: boolean; totalLikes: number }> {
    return await firstValueFrom(
      this.http.post<{ liked: boolean; totalLikes: number }>(`${this.API_URL}/story/${storyId}/like`, {})
    );
  }

  //============ DATA LOADING ============

  private async getDrafts(): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.http.get<{ drafts: StoryData[] }>(`${this.API_URL}/drafts`)
      );
      this._drafts.set(data?.drafts || []);
    } catch {
      this._drafts.set([]);
    }
  }

  private async getPublished(): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.http.get<{ published: StoryData[] }>(`${this.API_URL}/published`)
      );
      this._published.set(data?.published || []);
    } catch {
      this._published.set([]);
    }
  }

  private async getStats(): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.http.get<{ stats: UserStats }>(`${this.API_URL}/stats`)
      );
      this._stats.set(data?.stats || { drafts: 0, published: 0, totalLikes: 0 });
    } catch {
      this._stats.set({ drafts: 0, published: 0, totalLikes: 0 });
    }
  }

  private async refreshData(): Promise<void> {
    await this.loadStories();
  }
}