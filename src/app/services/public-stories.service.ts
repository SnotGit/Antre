import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000/api/public-stories';

  async getLatestStories(): Promise<UserLatestStory[]> {
    const response = await firstValueFrom(this.http.get<{ stories: UserLatestStory[] }>(
      this.API_URL
    ));
    
    return response?.stories || [];
  }

  async getUserProfile(username: string): Promise<UserProfileResponse | null> {
    const response = await firstValueFrom(this.http.get<UserProfileResponse>(
      `${this.API_URL}/users/${username}`
    ));
    
    return response || null;
  }

  async getStoryBySlug(slug: string): Promise<UserStory | null> {
    const response = await firstValueFrom(this.http.get<{ story: UserStory }>(
      `${this.API_URL}/story/${slug}`
    ));
    
    return response?.story || null;
  }

  async getStoryDetailBySlug(slug: string): Promise<StoryDetail | null> {
    const response = await firstValueFrom(this.http.get<{ story: StoryDetail }>(
      `${this.API_URL}/story/${slug}`
    ));
    
    return response?.story || null;
  }

  async toggleLike(storyId: number): Promise<{ success: boolean; liked: boolean; totalLikes: number }> {
    const response = await firstValueFrom(this.http.post<{ success: boolean; liked: boolean; totalLikes: number }>(
      `${this.API_URL}/story/${storyId}/like`, {}
    ));
    
    return response || { success: false, liked: false, totalLikes: 0 };
  }

  async getLikeStatus(storyId: number): Promise<{ isLiked: boolean; likesCount: number }> {
    const response = await firstValueFrom(this.http.get<{ isLiked: boolean; likesCount: number }>(
      `${this.API_URL}/story/${storyId}/like-status`
    ));
    
    return response || { isLiked: false, likesCount: 0 };
  }
}