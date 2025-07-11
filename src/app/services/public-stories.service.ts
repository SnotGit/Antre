import { Injectable, inject } from '@angular/core';
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

interface UserProfileResponse {
  user: {
    id: number;
    username: string;
    avatar: string;
    description: string;
    createdAt: string;
  };
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

  //============ API CALLS ============
  
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

  async getUserProfile(userId: number): Promise<UserProfileResponse | null> {
    const response = await fetch(`${this.API_URL}/users/${userId}`);
    if (!response.ok) return null;
    return await response.json();
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