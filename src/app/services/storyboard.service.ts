// storyboard.service.ts 
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';

// Interfaces alignées avec l'API backend
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
  
  // Signals pour l'état global
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  
  // Signals pour les données
  private _drafts = signal<DraftStoryFromAPI[]>([]);
  private _published = signal<PublishedStoryFromAPI[]>([]);
  
  // Signals publics en lecture seule
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();
  drafts = this._drafts.asReadonly();
  published = this._published.asReadonly();
  
  // Computed signals pour statistiques
  draftsCount = computed(() => this._drafts().length);
  publishedCount = computed(() => this._published().length);
  totalStories = computed(() => this.draftsCount() + this.publishedCount());

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Pas d'effect() ici - on charge explicitement quand nécessaire
  }

  // Méthode publique pour initialiser les données (appelée par les composants)
  async initializeUserData(): Promise<void> {
    if (!this.authService.isLoggedIn()) {
      console.log('❌ Utilisateur non connecté - pas de chargement des données');
      this._drafts.set([]);
      this._published.set([]);
      return;
    }

    console.log('🔄 Initialisation données storyboard pour:', this.authService.currentUser()?.username);
    await this.reloadAllData();
  }

  // Méthode publique pour recharger quand l'utilisateur change (appelée explicitement)
  async onUserChanged(): Promise<void> {
    console.log('🔄 Changement utilisateur détecté - Rechargement données storyboard');
    await this.initializeUserData();
  }

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

  // Recharger toutes les données (méthode privée)
  private async reloadAllData(): Promise<void> {
    try {
      await Promise.all([
        this.loadDraftsData(),
        this.loadPublishedData()
      ]);
    } catch (error) {
      console.error('Erreur lors du rechargement des données:', error);
      this._error.set('Erreur lors du rechargement des données');
    }
  }

  // Charger les brouillons (signal pur)
  async loadDraftsData(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const response = await this.http.get<APIResponse<DraftStoryFromAPI>>(
        `${this.API_URL}/chroniques/drafts`,
        { headers: this.getAuthHeaders() }
      ).toPromise();

      if (response) {
        this._drafts.set(response.drafts || []);
        console.log('📝 Brouillons chargés pour:', this.authService.currentUser()?.username, '- Count:', response.count);
      }
    } catch (error) {
      console.error('Erreur chargement brouillons:', error);
      this._error.set('Impossible de charger vos brouillons');
      this._drafts.set([]);
    } finally {
      this._loading.set(false);
    }
  }

  // Charger les histoires publiées (signal pur)
  async loadPublishedData(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const response = await this.http.get<APIResponse<PublishedStoryFromAPI>>(
        `${this.API_URL}/chroniques/published`,
        { headers: this.getAuthHeaders() }
      ).toPromise();

      if (response) {
        this._published.set(response.stories || []);
        console.log('📚 Histoires publiées chargées pour:', this.authService.currentUser()?.username, '- Count:', response.count);
      }
    } catch (error) {
      console.error('Erreur chargement histoires publiées:', error);
      this._error.set('Impossible de charger vos histoires publiées');
      this._published.set([]);
    } finally {
      this._loading.set(false);
    }
  }

  // Publier un brouillon
  async publishStory(storyId: number): Promise<void> {
    try {
      await this.http.put(
        `${this.API_URL}/chroniques/${storyId}/publish`,
        {},
        { headers: this.getAuthHeaders() }
      ).toPromise();

      console.log('Histoire publiée:', storyId);
      // Recharger automatiquement les données
      await this.reloadAllData();
    } catch (error) {
      console.error('Erreur publication:', error);
      this._error.set('Erreur lors de la publication');
      throw error;
    }
  }

  // Archiver une histoire
  async archiveStory(storyId: number): Promise<void> {
    try {
      await this.http.put(
        `${this.API_URL}/chroniques/${storyId}/archive`,
        {},
        { headers: this.getAuthHeaders() }
      ).toPromise();

      console.log('Histoire archivée:', storyId);
      await this.reloadAllData();
    } catch (error) {
      console.error('Erreur archivage:', error);
      this._error.set('Erreur lors de l\'archivage');
      throw error;
    }
  }

  // Supprimer une histoire
  async deleteStory(storyId: number): Promise<void> {
    try {
      await this.http.delete(
        `${this.API_URL}/stories/${storyId}`,
        { headers: this.getAuthHeaders() }
      ).toPromise();

      console.log('Histoire supprimée:', storyId);
      await this.reloadAllData();
    } catch (error) {
      console.error('Erreur suppression:', error);
      this._error.set('Erreur lors de la suppression');
      throw error;
    }
  }

  // Sauvegarder un brouillon
  async saveDraft(draftData: { title: string; content: string }, storyId?: number): Promise<void> {
    const url = storyId 
      ? `${this.API_URL}/chroniques/drafts/${storyId}` 
      : `${this.API_URL}/chroniques/drafts`;
    
    const method = storyId ? 'put' : 'post';

    try {
      await this.http[method](
        url,
        draftData,
        { headers: this.getAuthHeaders() }
      ).toPromise();

      console.log('Brouillon sauvegardé:', storyId || 'nouveau');
      // Recharger seulement les brouillons
      await this.loadDraftsData();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      this._error.set('Erreur lors de la sauvegarde');
      throw error;
    }
  }

  // Like/Unlike une histoire
  async toggleLike(storyId: number): Promise<void> {
    try {
      await this.http.post(
        `${this.API_URL}/chroniques/${storyId}/like`,
        {},
        { headers: this.getAuthHeaders() }
      ).toPromise();

      console.log('Like togglé:', storyId);
      // Optionnel: recharger pour avoir les likes à jour
      await this.loadPublishedData();
    } catch (error) {
      console.error('Erreur toggle like:', error);
      this._error.set('Erreur lors du like');
      throw error;
    }
  }

  // Récupérer un brouillon pour édition
  async getDraftForEdit(storyId: number): Promise<any> {
    try {
      return await this.http.get(
        `${this.API_URL}/chroniques/drafts/${storyId}`,
        { headers: this.getAuthHeaders() }
      ).toPromise();
    } catch (error) {
      console.error('Erreur récupération brouillon:', error);
      this._error.set('Erreur lors de la récupération du brouillon');
      throw error;
    }
  }

  // Utilitaires
  isUserAuthenticated(): boolean {
    return this.authService.isLoggedIn();
  }

  getCurrentUser() {
    return this.authService.currentUser();
  }

  // Formatage pour les composants
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

  // Nettoyage explicite des données (quand l'utilisateur se déconnecte)
  clearUserData(): void {
    this._drafts.set([]);
    this._published.set([]);
    this._error.set(null);
    this._loading.set(false);
    console.log('🧹 Données utilisateur nettoyées');
  }
}