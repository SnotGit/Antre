// storyboard.service.ts - Version corrigée et simplifiée
import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

// Interfaces alignées avec l'API backend
export interface DraftStoryFromAPI {
  id: number;
  title: string;
  content: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
  lastModified: string; // Formaté côté API
  status: string;
}

export interface PublishedStoryFromAPI {
  id: number;
  title: string;
  publishDate: string; // Formaté côté API
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
  
  // Signals pour l'état global
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  // Computed signals publics
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Headers avec authentification
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

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
          console.log('Brouillons chargés:', response.count);
          this._loading.set(false);
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          console.error('Erreur chargement brouillons:', error);
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
          console.log('Histoires publiées chargées:', response.count);
          this._loading.set(false);
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          console.error('Erreur chargement histoires publiées:', error);
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
          console.log('Histoire publiée:', storyId);
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          console.error('Erreur publication:', error);
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
          console.log('Histoire archivée:', storyId);
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          console.error('Erreur archivage:', error);
          observer.error(error);
        }
      });
    });
  }

  // Supprimer une histoire (utilise l'API stories générale)
  deleteStory(storyId: number): Observable<any> {
    return new Observable(observer => {
      this.http.delete(
        `${this.API_URL}/stories/${storyId}`,
        { headers: this.getAuthHeaders() }
      ).subscribe({
        next: (response) => {
          console.log('Histoire supprimée:', storyId);
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          console.error('Erreur suppression:', error);
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
          console.log('Brouillon sauvegardé:', storyId || 'nouveau');
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          console.error('Erreur sauvegarde:', error);
          observer.error(error);
        }
      });
    });
  }

  // Like/Unlike une histoire
  toggleLike(storyId: number): Observable<any> {
    return new Observable(observer => {
      this.http.post(
        `${this.API_URL}/chroniques/${storyId}/like`,
        {},
        { headers: this.getAuthHeaders() }
      ).subscribe({
        next: (response) => {
          console.log('Like togglé:', storyId);
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          console.error('Erreur toggle like:', error);
          observer.error(error);
        }
      });
    });
  }

  // Vérifier l'authentification (méthode corrigée)
  isUserAuthenticated(): boolean {
    return this.authService.isLoggedIn();
  }

  // Obtenir l'utilisateur actuel
  getCurrentUser() {
    return this.authService.currentUser();
  }

  // Utilitaire pour formater les données API en format component
  formatDraftForComponent(draft: DraftStoryFromAPI) {
    return {
      id: draft.id,
      title: draft.title || 'Histoire sans titre',
      lastModified: draft.lastModified,
      status: draft.status
    };
  }

  formatPublishedForComponent(story: PublishedStoryFromAPI) {
    return {
      id: story.id,
      title: story.title,
      publishDate: story.publishDate,
      likes: story.likes
    };
  }
}