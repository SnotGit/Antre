import { Injectable } from '@angular/core';

interface Story {
  id: number;
  title: string;
  publishDate: string;
  likes: number;
  isliked: boolean;
  content?: string;
  user?: {
    id: number;
    username: string;
    avatar: string;
    description: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PublicStoriesService {
  
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

  async getUserStories(userId: number): Promise<Story[]> {
    const response = await fetch(`${this.API_URL}/users/${userId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.stories || [];
  }
}