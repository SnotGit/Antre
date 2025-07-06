import { Injectable, inject, signal } from '@angular/core';
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

interface SaveDraftResponse {
  message: string;
  story: {
    id: number;
    title: string;
    content: string;
    status: string;
  };
}

interface EditPublishedResponse {
  message: string;
  story: StoryData;
  originalStoryId: number;
}

@Injectable({
  providedIn: 'root'
})
export class PrivateStoriesService {
  private readonly authService = inject(AuthService);
  private readonly API_URL = 'http://localhost:3000/api/private-stories';

  //============ SIGNALS ÉTAT ============

  private _drafts = signal<DraftStory[]>([]);
  private _published = signal<PublishedStory[]>([]);
  private _stats = signal<UserStats>({ drafts: 0, published: 0, totalLikes: 0 });
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  //============ COMPUTED PUBLICS ============

  readonly drafts = this._drafts.asReadonly();
  readonly published = this._published.asReadonly();
  readonly stats = this._stats.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  //============ INITIALISATION ============

  async initializeUserData(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    await Promise.all([
      this.loadDrafts(),
      this.loadPublished(), 
      this.loadStats()
    ]);

    this._loading.set(false);
  }

  //============ GESTION BROUILLONS ============

  async loadDrafts(): Promise<void> {
    const response = await this.fetchWithAuth(`${this.API_URL}/drafts`);
    const data = await response.json();
    this._drafts.set(data?.drafts || []);
  }

  async saveDraft(data: { title: string; content: string }, id?: number): Promise<SaveDraftResponse> {
    this._loading.set(true);
    this._error.set(null);

    const url = id ? `${this.API_URL}/draft/${id}` : `${this.API_URL}/draft`;
    const method = id ? 'PUT' : 'POST';

    const response = await this.fetchWithAuth(url, {
      method,
      body: JSON.stringify(data)
    });

    const result = await response.json();
    await this.loadDrafts();
    this._loading.set(false);
    
    return result;
  }

  async getDraftForEdit(id: number): Promise<StoryData | null> {
    this._loading.set(true);
    
    const response = await this.fetchWithAuth(`${this.API_URL}/draft/${id}`);
    const data = await response.json();
    
    this._loading.set(false);
    return data?.story || null;
  }

  //============ GESTION ÉDITION HISTOIRES PUBLIÉES ============

  async getPublishedForEdit(id: number): Promise<EditPublishedResponse | null> {
    this._loading.set(true);
    this._error.set(null);

    const response = await this.fetchWithAuth(`${this.API_URL}/edit-published/${id}`);
    const data = await response.json();
    
    await this.loadDrafts();
    this._loading.set(false);
    
    return data || null;
  }

  async republishStory(draftId: number, originalId: number): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    await this.fetchWithAuth(`${this.API_URL}/republish/${draftId}`, {
      method: 'POST',
      body: JSON.stringify({ originalId })
    });

    await this.initializeUserData();
  }

  //============ GESTION PUBLICATION ============

  async loadPublished(): Promise<void> {
    const response = await this.fetchWithAuth(`${this.API_URL}/published`);
    const data = await response.json();
    this._published.set(data?.published || []);
  }

  async publishStory(id: number): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    await this.fetchWithAuth(`${this.API_URL}/publish/${id}`, {
      method: 'POST'
    });

    await this.initializeUserData();
  }

  //============ GESTION SUPPRESSION ============

  async deleteStory(id: number): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    await this.fetchWithAuth(`${this.API_URL}/story/${id}`, {
      method: 'DELETE'
    });

    await this.initializeUserData();
  }

  //============ STATISTIQUES ============

  async loadStats(): Promise<void> {
    const response = await this.fetchWithAuth(`${this.API_URL}/stats`);
    const data = await response.json();
    this._stats.set(data?.stats || { drafts: 0, published: 0, totalLikes: 0 });
  }

  //============ UTILITAIRES ============

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.authService.getStoredToken();
    if (!token) {
      this._error.set('Non authentifié');
      throw new Error('Non authentifié');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erreur serveur' }));
      this._error.set(error.error || 'Erreur réseau');
      throw new Error(error.error || 'Erreur réseau');
    }

    return response;
  }

  clearUserData(): void {
    this._drafts.set([]);
    this._published.set([]);
    this._stats.set({ drafts: 0, published: 0, totalLikes: 0 });
    this._error.set(null);
  }

  clearError(): void {
    this._error.set(null);
  }
}