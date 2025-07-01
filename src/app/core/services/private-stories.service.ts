import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

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
  id?: number;
  title: string;
  content: string;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PrivateStoriesService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly API_URL = 'http://localhost:3000/api/private-stories';

  private _drafts = signal<DraftStory[]>([]);
  private _published = signal<PublishedStory[]>([]);
  private _stats = signal<UserStats>({ drafts: 0, published: 0, totalLikes: 0 });

  readonly drafts = this._drafts.asReadonly();
  readonly published = this._published.asReadonly();
  readonly stats = this._stats.asReadonly();

  private get headers(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`,
      'Content-Type': 'application/json'
    });
  }

  async initializeUserData(): Promise<void> {
    await Promise.all([
      this.loadDrafts(),
      this.loadPublished(), 
      this.loadStats()
    ]);
  }

  async loadDrafts(): Promise<void> {
    const response = await firstValueFrom(this.http.get<{ drafts: DraftStory[] }>(
      `${this.API_URL}/drafts`, 
      { headers: this.headers }
    ));
    
    this._drafts.set(response?.drafts || []);
  }

  async loadPublished(): Promise<void> {
    const response = await firstValueFrom(this.http.get<{ published: PublishedStory[] }>(
      `${this.API_URL}/published`, 
      { headers: this.headers }
    ));
    
    this._published.set(response?.published || []);
  }

  async loadStats(): Promise<void> {
    const response = await firstValueFrom(this.http.get<{ stats: UserStats }>(
      `${this.API_URL}/stats`, 
      { headers: this.headers }
    ));
    
    this._stats.set(response?.stats || { drafts: 0, published: 0, totalLikes: 0 });
  }

  async saveDraft(data: { title: string; content: string }, id?: number): Promise<void> {
    const url = id ? `${this.API_URL}/draft/${id}` : `${this.API_URL}/draft`;
    const method = id ? 'put' : 'post';

    await firstValueFrom(this.http[method](url, data, { headers: this.headers }));
    await this.loadDrafts();
  }

  async publishStory(id: number): Promise<void> {
    await firstValueFrom(this.http.post(`${this.API_URL}/publish/${id}`, {}, { headers: this.headers }));
    await this.initializeUserData();
  }

  async deleteStory(id: number): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.API_URL}/story/${id}`, { headers: this.headers }));
    await this.initializeUserData();
  }

  async getDraftForEdit(id: number): Promise<StoryData | null> {
    const response = await firstValueFrom(this.http.get<{ story: StoryData }>(
      `${this.API_URL}/draft/${id}`, 
      { headers: this.headers }
    ));
    
    return response?.story || null;
  }

  clearUserData(): void {
    this._drafts.set([]);
    this._published.set([]);
    this._stats.set({ drafts: 0, published: 0, totalLikes: 0 });
  }
}