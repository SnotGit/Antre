import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';

interface UserLatestStory {
  id: number;
  title: string;
  publishDate: string;
  likes: number;
  slug: string;
  user: {
    id: number;
    username: string;
    avatar: string;
    description: string;
  };
}

interface UserProfile {
  id: number;
  username: string;
  avatar: string;
  description: string;
  createdAt: string;
}

interface UserStory {
  id: number;
  title: string;
  publishDate: string;
  likes: number;
  slug: string;
}

interface StoryDetail {
  id: number;
  title: string;
  content: string;
  publishDate: string;
  likes: number;
  slug: string;
  user: {
    id: number;
    username: string;
    avatar: string;
    description: string;
  };
}

interface Category {
  id: number;
  name: string;
  stories: UserStory[];
}

interface UserProfileResponse {
  user: UserProfile;
  displayMode: 'categories' | 'stories';
  categories?: Category[];
  stories?: UserStory[];
  storiesCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class PublicStoriesService {
  private readonly authService = inject(AuthService);
  private readonly API_URL = 'http://localhost:3000/api/public-stories';

  //============ SIGNALS ÉTAT ============

  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _latestStories = signal<UserLatestStory[]>([]);

  //============ COMPUTED PUBLICS ============

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly latestStories = this._latestStories.asReadonly();

  //============ HISTOIRES RÉCENTES ============

  async getLatestStories(): Promise<UserLatestStory[]> {
    this._loading.set(true);
    this._error.set(null);

    const response = await this.fetchPublic(this.API_URL);
    const data = await response.json();
    
    const stories = data?.stories || [];
    this._latestStories.set(stories);
    this._loading.set(false);
    
    return stories;
  }

  //============ PROFIL UTILISATEUR ============

  async getUserProfile(username: string): Promise<UserProfileResponse | null> {
    this._loading.set(true);
    this._error.set(null);

    const response = await this.fetchPublic(`${this.API_URL}/users/${username}`);
    const data = await response.json();
    
    this._loading.set(false);
    return data || null;
  }

  //============ DÉTAIL HISTOIRE ============

  async getStoryBySlug(slug: string): Promise<UserStory | null> {
    this._loading.set(true);
    this._error.set(null);

    const response = await this.fetchPublic(`${this.API_URL}/story/${slug}`);
    const data = await response.json();
    
    this._loading.set(false);
    return data?.story || null;
  }

  async getStoryDetailBySlug(slug: string): Promise<StoryDetail | null> {
    this._loading.set(true);
    this._error.set(null);

    const response = await this.fetchPublic(`${this.API_URL}/story/${slug}`);
    const data = await response.json();
    
    this._loading.set(false);
    return data?.story || null;
  }

  //============ GESTION LIKES ============

  async toggleLike(storyId: number): Promise<{ success: boolean; liked: boolean; totalLikes: number }> {
    this._loading.set(true);
    this._error.set(null);

    const token = this.authService.getStoredToken();
    if (!token) {
      this._error.set('Connexion requise pour liker');
      this._loading.set(false);
      return { success: false, liked: false, totalLikes: 0 };
    }

    const response = await fetch(`${this.API_URL}/story/${storyId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erreur like' }));
      this._error.set(error.error || 'Erreur lors du like');
      this._loading.set(false);
      return { success: false, liked: false, totalLikes: 0 };
    }

    const data = await response.json();
    this._loading.set(false);
    
    return data || { success: false, liked: false, totalLikes: 0 };
  }

  async getLikeStatus(storyId: number): Promise<{ isLiked: boolean; likesCount: number }> {
    this._loading.set(true);
    this._error.set(null);

    const token = this.authService.getStoredToken();
    if (!token) {
      this._loading.set(false);
      return { isLiked: false, likesCount: 0 };
    }

    const response = await fetch(`${this.API_URL}/story/${storyId}/like-status`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      this._loading.set(false);
      return { isLiked: false, likesCount: 0 };
    }

    const data = await response.json();
    this._loading.set(false);
    
    return data || { isLiked: false, likesCount: 0 };
  }

  //============ UTILITAIRES ============

  private async fetchPublic(url: string, options: RequestInit = {}): Promise<Response> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
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

  clearError(): void {
    this._error.set(null);
  }

  refreshLatestStories(): Promise<UserLatestStory[]> {
    return this.getLatestStories();
  }
}