import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

interface Story {
  id: number;
  title: string;
  publishDate: string;
  likes: number;
  isLiked?: boolean;
  content?: string;
  user?: {
    id: number;
    username: string;
    avatar: string;
    description: string;
  };
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

  async getLatestStories(): Promise<Story[]> {
    const response = await fetch(this.API_URL);
    const data = await response.json();
    return data.stories;
  }

  async getStoryById(id: number): Promise<Story | null> {
    const response = await fetch(`${this.API_URL}/story/${id}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.story;
  }

  async getStoryByUsernameAndTitle(username: string, title: string): Promise<Story | null> {
    const response = await fetch(`${this.API_URL}/story/${username}/${encodeURIComponent(title)}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.story;
  }

  async getUserStories(userId: number): Promise<Story[]> {
    const response = await fetch(`${this.API_URL}/users/${userId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.stories || [];
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
}