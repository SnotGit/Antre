import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

export interface StoryCard {
  id: number;
  title: string;
  publishDate: string;
  user: {
    id: number;
    username: string;
    avatar: string;
  };
}

export interface StoryReader {
  id: number;
  title: string;
  content: string;
  publishDate: string;
  likes: number;
  isliked: boolean;
  user: {
    id: number;
    username: string;
    avatar: string;
    description: string;
  };
}

export interface UserStories {
  id: number;
  title: string;
}

export interface LatestStoriesResponse {
  stories: StoryCard[];
}

export interface StoryResponse {
  story: StoryReader;
}

export interface UserStoriesResponse {
  stories: UserStories[];
}

@Injectable({
  providedIn: 'root'
})
export class PublicStoriesService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly CHRONIQUES_API = `${environment.apiUrl}/chroniques`;
  private readonly USER_API = `${environment.apiUrl}/user`;

  //======= GET LATEST STORIES =======

  async getLatestStories(): Promise<StoryCard[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<LatestStoriesResponse>(`${this.CHRONIQUES_API}/stories/latest`)
      );

      const stories = response.stories || [];
      
      return stories.map(story => ({
        ...story,
        publishDate: this.formatDate(story.publishDate)
      }));
    } catch (error) {
      throw error;
    }
  }

  //======= GET SINGLE STORY =======

  async getStory(storyId: number): Promise<StoryReader> {
    try {
      const response = await firstValueFrom(
        this.http.get<StoryResponse>(`${this.CHRONIQUES_API}/stories/${storyId}`)
      );
      
      return response.story;
    } catch (error) {
      throw error;
    }
  }

  //======= GET USER STORIES =======

  async getStories(userId: number): Promise<UserStories[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<UserStoriesResponse>(`${this.USER_API}/${userId}/stories`)
      );
      
      return response.stories || [];
    } catch (error) {
      throw error;
    }
  }

  //======= HELPER =======

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}