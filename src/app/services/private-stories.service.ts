import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface DraftStory {
  id: number;
  title: string;
  lastModified: string;
  status: string;
}

interface PublishedStory {
  id: number;
  title: string;
  lastModified: string;
  likes: number;
}

interface UserStats {
  drafts: number;
  published: number;
  totalLikes: number;
}

interface StoryData {
  id: number;
  title: string;
  content: string;
  status?: string;
}

interface SaveDraftResponse {
  message: string;
  story: {
    id: number;
    title: string;
    content: string;
    status: string;
  };
}

interface EditStoryResponse {
  message: string;
  story: StoryData;
  originalStoryId?: number;
}

interface LikeResponse {
  success: boolean;
  liked: boolean;
  totalLikes: number;
}

interface TitleResolution {
  id: number;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class PrivateStoriesService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000/api/private-stories';

  private _drafts = signal<DraftStory[]>([]);
  private _published = signal<PublishedStory[]>([]);
  private _stats = signal<UserStats>({ drafts: 0, published: 0, totalLikes: 0 });
  private _loading = signal<boolean>(false);

  readonly drafts = this._drafts.asReadonly();
  readonly published = this._published.asReadonly();
  readonly stats = this._stats.asReadonly();
  readonly loading = this._loading.asReadonly();

  //============ INITIALISATION ============

  async initializeUserData(): Promise<void> {
    this._loading.set(true);

    await Promise.all([
      this.loadDrafts(),
      this.loadPublished(),
      this.loadStats()
    ]);

    this._loading.set(false);
  }

  //============ RÉSOLUTION TITRE ============

  async resolveTitle(title: string): Promise<TitleResolution | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<TitleResolution>(`${this.API_URL}/resolve/${encodeURIComponent(title)}`)
      );
      return response;
    } catch (error) {
      return null;
    }
  }

  //============ LISTES ============

  async loadDrafts(): Promise<void> {
    const data = await firstValueFrom(
      this.http.get<{ drafts: DraftStory[] }>(`${this.API_URL}/drafts`)
    );
    this._drafts.set(data?.drafts || []);
  }

  async loadPublished(): Promise<void> {
    const data = await firstValueFrom(
      this.http.get<{ published: PublishedStory[] }>(`${this.API_URL}/published`)
    );
    this._published.set(data?.published || []);
  }

  async loadStats(): Promise<void> {
    const data = await firstValueFrom(
      this.http.get<{ stats: UserStats }>(`${this.API_URL}/stats`)
    );
    this._stats.set(data?.stats || { drafts: 0, published: 0, totalLikes: 0 });
  }

  //============ ÉDITION ============

  async getStoryForEdit(id: number): Promise<EditStoryResponse | null> {
    this._loading.set(true);

    try {
      const data = await firstValueFrom(
        this.http.get<EditStoryResponse>(`${this.API_URL}/edit/${id}`)
      );
      this._loading.set(false);
      return data;
    } catch (error) {
      this._loading.set(false);
      return null;
    }
  }

  //============ SAUVEGARDE ============

  async saveDraft(data: { title: string; content: string }, storyId?: number): Promise<SaveDraftResponse> {
    this._loading.set(true);

    const result = storyId 
      ? await this.updateDraft(data, storyId)
      : await this.createDraft(data);
    
    await this.loadDrafts();
    this._loading.set(false);
    
    return result;
  }

  private async createDraft(data: { title: string; content: string }): Promise<SaveDraftResponse> {
    return await firstValueFrom(
      this.http.post<SaveDraftResponse>(`${this.API_URL}/draft`, data)
    );
  }

  private async updateDraft(data: { title: string; content: string }, storyId: number): Promise<SaveDraftResponse> {
    return await firstValueFrom(
      this.http.put<SaveDraftResponse>(`${this.API_URL}/draft/${storyId}`, data)
    );
  }

  //============ PUBLICATION ============

  async publishStory(storyId: number): Promise<void> {
    this._loading.set(true);

    await firstValueFrom(
      this.http.post(`${this.API_URL}/publish/${storyId}`, {})
    );
    
    await this.initializeUserData();
  }

  async updateStory(draftId: number, originalStoryId: number): Promise<void> {
    this._loading.set(true);

    await firstValueFrom(
      this.http.post(`${this.API_URL}/update/${draftId}`, { originalStoryId: originalStoryId })
    );
    
    await this.initializeUserData();
  }

  //============ SUPPRESSION ============

  async deleteStory(storyId: number): Promise<void> {
    this._loading.set(true);

    await firstValueFrom(
      this.http.delete(`${this.API_URL}/story/${storyId}`)
    );
    
    await this.initializeUserData();
  }

  //============ LIKES ============

  async toggleLike(storyId: number): Promise<LikeResponse> {
    return await firstValueFrom(
      this.http.post<LikeResponse>(`${this.API_URL}/story/${storyId}/like`, {})
    );
  }
}