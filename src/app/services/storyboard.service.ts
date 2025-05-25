import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface DraftStoryFromAPI {
  id: number;
  title: string;
  content: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
  lastModified: string;
  status: string;
}

export interface PublishedStoryFromAPI {
  id: number;
  title: string;
  publishDate: string;
  likes: number;
  views: number;
  wordCount: number;
}

export interface APIResponse<T> {
  message: string;
  drafts?: T[];
  stories?: T[];
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class StoryboardService {
  private readonly API_URL = 'http://localhost:3000/api';
  
  // Signals pour l'état
  private _drafts = signal<DraftStoryFromAPI[]>([]);
  private _published = signal<PublishedStoryFromAPI[]>([]);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  // Computed signals publics
  drafts = this._drafts.asReadonly();
  published = this._published.asReadonly();
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Headers avec authentification
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Charger les brouillons de l'utilisateur connecté
  loadUserDrafts(): Observable<APIResponse<DraftStoryFromAPI>> {
    this._loading.set(true);
    this._error.set(null);

    return new Observable(observer => {
      this.http.get<APIResponse<DraftStoryFromAPI>>(
        `${this.API_URL}/chroniques/drafts`,
        { headers: this.getAuthHeaders() }
      ).subscribe({
        next: (response) => {
          this._drafts.set(response.drafts || []);
          this._loading.set(false);
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des brouillons:', error);
          this._error.set('Impossible de charger vos brouillons');
          this._loading.set(false);
          observer.error(error);
        }
      });
    });
  }

  // Charger les histoires publiées de l'utilisateur connecté
  loadUserPublishedStories(): Observable<APIResponse<PublishedStoryFromAPI>> {
    this._loading.set(true);
    this._error.set(null);

    return new Observable(observer => {
      this.http.get<APIResponse<PublishedStoryFromAPI>>(
        `${this.API_URL}/chroniques/published`,
        { headers: this.getAuthHeaders() }
      ).subscribe({
        next: (response) => {
          this._published.set(response.stories || []);
          this._loading.set(false);
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des histoires publiées:', error);
          this._error.set('Impossible de charger vos histoires publiées');
          this._loading.set(false);
          observer.error(error);
        }
      });
    });
  }

  // Publier un brouillon
  publishStory(storyId: number): Observable<any> {
    return new Observable(observer => {
      this.http.put(
        `${this.API_URL}/chroniques/${storyId}/publish`,
        {},
        { headers: this.getAuthHeaders() }
      ).subscribe({
        next: (response) => {
          // Recharger les données après publication
          this.refreshData();
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          console.error('Erreur lors de la publication:', error);
          observer.error(error);
        }
      });
    });
  }

  // Archiver une histoire publiée
  archiveStory(storyId: number): Observable<any> {
    return new Observable(observer => {
      this.http.put(
        `${this.API_URL}/chroniques/${storyId}/archive`,
        {},
        { headers: this.getAuthHeaders() }
      ).subscribe({
        next: (response) => {
          // Recharger les données après archivage
          this.refreshData();
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          console.error('Erreur lors de l\'archivage:', error);
          observer.error(error);
        }
      });
    });
  }

  // Supprimer un brouillon (DELETE story)
  deleteStory(storyId: number): Observable<any> {
    return new Observable(observer => {
      this.http.delete(
        `${this.API_URL}/stories/${storyId}`,
        { headers: this.getAuthHeaders() }
      ).subscribe({
        next: (response) => {
          // Recharger les données après suppression
          this.refreshData();
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          observer.error(error);
        }
      });
    });
  }

  // Récupérer un brouillon spécifique pour édition
  getDraftForEdit(storyId: number): Observable<any> {
    return this.http.get(
      `${this.API_URL}/chroniques/drafts/${storyId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Sauvegarder un brouillon
  saveDraft(draftData: { title: string; content: string }, storyId?: number): Observable<any> {
    const url = storyId 
      ? `${this.API_URL}/chroniques/drafts/${storyId}` 
      : `${this.API_URL}/chroniques/drafts`;
    
    const method = storyId ? 'put' : 'post';

    return new Observable(observer => {
      this.http[method](
        url,
        draftData,
        { headers: this.getAuthHeaders() }
      ).subscribe({
        next: (response) => {
          // Recharger les brouillons après sauvegarde
          this.loadUserDrafts().subscribe();
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          console.error('Erreur lors de la sauvegarde:', error);
          observer.error(error);
        }
      });
    });
  }

  // Actualiser toutes les données
  refreshData(): void {
    this.loadUserDrafts().subscribe();
    this.loadUserPublishedStories().subscribe();
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  // Initialiser les données utilisateur
  initializeUserData(): void {
    if (this.isAuthenticated()) {
      this.refreshData();
    }
  }
}