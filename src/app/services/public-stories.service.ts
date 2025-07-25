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

  //============ LATEST STORIES ============

  async getLatestStories(): Promise<Story[]> {
    const response = await fetch(`${this.API_URL}/stories`);
    const data = await response.json();
    return data.stories;
  }

  //============ STORY BY ID ============

  async getStoryById(id: number): Promise<Story | null> {
    const response = await fetch(`${this.API_URL}/story/${id}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.story;
  }

  //============ USER STORIES BY ID ============

  async getUserStories(userId: number): Promise<Story[]> {
    const response = await fetch(`${this.API_URL}/user/${userId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.stories || [];
  }

  //============ RESOLVERS ============

  async resolveUsername(username: string): Promise<number | null> {
    const response = await fetch(`${this.API_URL}/resolve/username/${username}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.userId;
  }

  async resolveStory(username: string, title: string): Promise<{ storyId: number; authorId: number } | null> {
    const response = await fetch(`${this.API_URL}/resolve/${username}/${encodeURIComponent(title)}`);
    if (!response.ok) return null;
    const data = await response.json();
    return { storyId: data.storyId, authorId: data.authorId };
  }
}