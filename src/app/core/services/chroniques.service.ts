import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuthorWithLatestStory {
  id: number;
  username: string;
  description: string;
  avatar: string;
  latestStory: {
    id: number;
    title: string;
    slug: string;
    publishedAt: string;
  };
}

export interface StoryFromAPI {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  user: {
    id: number;
    username: string;
    description: string | null;
    avatar: string | null;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ChroniquesService {
  private readonly API_URL = 'http://localhost:3000/api';
  
  // Signal pour stocker les auteurs récents
  private _recentAuthors = signal<AuthorWithLatestStory[]>([]);
  
  // Signal pour l'état de chargement
  private _loading = signal<boolean>(false);
  
  // Signal pour les erreurs
  private _error = signal<string | null>(null);

  // Computed signals pour l'accès externe
  recentAuthors = this._recentAuthors.asReadonly();
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();

  constructor(private http: HttpClient) {
    // Charger les données au démarrage
    this.loadRecentAuthors();
  }

  // Charger les 4 derniers auteurs avec leur histoire la plus récente
  loadRecentAuthors(): void {
    this._loading.set(true);
    this._error.set(null);

    this.http.get<{message: string, authors: AuthorWithLatestStory[], count: number}>
      (`${this.API_URL}/chroniques/recent-authors`).subscribe({
      next: (response) => {
        const authors = response.authors || [];
        this._recentAuthors.set(authors);
        this._loading.set(false);
      },
      error: (error) => {
        this._error.set('Erreur lors du chargement des chroniques');
        this._loading.set(false);
        
        // En cas d'erreur, utiliser des données de fallback
        this.loadFallbackData();
      }
    });
  }

  // Données de fallback en cas d'erreur API
  private loadFallbackData(): void {
    // Essayer avec l'API stories existante
    this.http.get<StoryFromAPI[]>(`${this.API_URL}/stories`).subscribe({
      next: (stories) => {
        const authorsWithStories = this.transformStoriesToAuthors(stories);
        this._recentAuthors.set(authorsWithStories);
        this._error.set(null);
      },
      error: (error) => {
        this._recentAuthors.set([]);
        this._error.set('Aucune chronique disponible');
      }
    });
  }

  // Transformer les stories en format AuthorWithLatestStory
  private transformStoriesToAuthors(stories: StoryFromAPI[]): AuthorWithLatestStory[] {
    // Filtrer seulement les histoires publiées
    const publishedStories = stories.filter(story => story.publishedAt !== null);
    
    // Grouper par auteur et prendre la plus récente de chaque
    const authorsMap = new Map<number, AuthorWithLatestStory>();
    
    publishedStories.forEach(story => {
      const existingAuthor = authorsMap.get(story.user.id);
      
      if (!existingAuthor || new Date(story.publishedAt!) > new Date(existingAuthor.latestStory.publishedAt)) {
        authorsMap.set(story.user.id, {
          id: story.user.id,
          username: story.user.username,
          description: story.user.description || 'Écrivain martien',
          avatar: story.user.avatar || 'assets/images/default-avatar.png',
          latestStory: {
            id: story.id,
            title: story.title,
            slug: this.createSlug(story.title),
            publishedAt: story.publishedAt!
          }
        });
      }
    });
    
    // Retourner les 4 plus récents
    return Array.from(authorsMap.values())
      .sort((a, b) => new Date(b.latestStory.publishedAt).getTime() - new Date(a.latestStory.publishedAt).getTime())
      .slice(0, 4);
  }

  // Méthode pour rafraîchir les données
  refresh(): void {
    this.loadRecentAuthors();
  }

  // Méthode pour créer un slug à partir d'un titre
  createSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }
}