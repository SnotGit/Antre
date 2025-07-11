import { Injectable, inject, signal, resource } from '@angular/core';
import { AuthService } from './auth.service';

interface Story {
  id: number;
  title: string;
  publishDate: string;
  likes: number;
  content?: string;
  user?: {
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

interface UserProfileResponse {
  user: UserProfile;
  stories: Story[];
  storiesCount: number;
}

interface LikeResponse {
  success: boolean;
  liked: boolean;
  totalLikes: number;
}

@Injectable({
  providedIn: 'root'
})
export class PublicStoriesService {
  
  private authService = inject(AuthService);
  private readonly API_URL = 'http://localhost:3000/api/public-stories';

  // ============ REACTIVE PARAMETERS ============
  
  private refreshTrigger = signal(0);
  private storyIdParam = signal<number>(0);
  private userIdParam = signal<number>(0);

  // ============ RESOURCES ============
  
  latestStoriesResource = resource({
    params: () => ({ refresh: this.refreshTrigger() }),
    loader: async ({ abortSignal }) => {
      const response = await fetch(this.API_URL, {
        signal: abortSignal,
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      return data.stories as Story[];
    }
  });

  storyResource = resource({
    params: () => ({ id: this.storyIdParam() }),
    loader: async ({ params, abortSignal }) => {
      if (!params.id) return null;
      const response = await fetch(`${this.API_URL}/story/${params.id}`, {
        signal: abortSignal,
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      return data.story as Story;
    }
  });

  userProfileResource = resource({
    params: () => ({ userId: this.userIdParam() }),
    loader: async ({ params, abortSignal }) => {
      if (!params.userId) return null;
      const response = await fetch(`${this.API_URL}/users/${params.userId}`, {
        signal: abortSignal,
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      return data as UserProfileResponse;
    }
  });

  // ============ PUBLIC API ============
  
  getLatestStories() {
    this.refreshTrigger.update(v => v + 1);
    return this.latestStoriesResource;
  }

  getStoryById(id: number) {
    this.storyIdParam.set(id);
    return this.storyResource;
  }

  getUserProfile(userId: number) {
    this.userIdParam.set(userId);
    return this.userProfileResource;
  }

  async toggleLike(storyId: number): Promise<LikeResponse> {
    const response = await fetch(`${this.API_URL}/story/${storyId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authService.getStoredToken()}`
      }
    });
    return await response.json();
  }

  refresh(): void {
    this.refreshTrigger.update(v => v + 1);
  }
}