import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { PrivateStoriesService } from '../services/private-stories.service';
import { PublicStoriesService } from '../services/public-stories.service';

interface ResolvedPrivateStory {
  storyId: number;
  title: string;
  content: string;
  originalStoryId?: number;
}

interface ResolvedPublicStory {
  storyId: number;
  userId: number;
}

interface ResolvedUser {
  userId: number;
}

type ResolvedData = ResolvedPrivateStory | ResolvedPublicStory | ResolvedUser | null;

//============ RESOLVER ============

export const chroniquesResolver: ResolveFn<ResolvedData> = async (route) => {
  const privateStories = inject(PrivateStoriesService);
  const publicStories = inject(PublicStoriesService);
  
  const segments = route.url.map(segment => segment.path);
  const fullPath = segments.join('/');
  
  //============ NO RESOLUTION ROUTES ============
  
  if (segments.length === 0) {
    return null;
  }
  
  if (segments.length === 1 && segments[0] === 'mes-histoires') {
    return null;
  }
  
  if (segments.length === 2 && segments[0] === 'mes-histoires') {
    const secondSegment = segments[1];
    if (secondSegment === 'brouillons' || secondSegment === 'publiees') {
      return null;
    }
  }
  
  if (fullPath.endsWith('nouvelle-histoire')) {
    return null;
  }
  
  //============ PRIVATE EDITION ============
  
  const isPrivateEditRoute = segments.includes('mes-histoires') && 
                            segments.includes('edition') &&
                            (segments.includes('brouillon') || segments.includes('publiee'));
  
  if (isPrivateEditRoute) {
    const title = route.paramMap.get('title');
    if (!title) {
      throw new Error('Missing title');
    }
    
    const resolution = await privateStories.resolveTitle(title);
    if (!resolution) {
      throw new Error(`Story "${title}" not found`);
    }
    
    const response = await privateStories.getStory(resolution.id);
    if (!response) {
      throw new Error(`Story "${title}" not found`);
    }
    
    return {
      storyId: response.story.id,
      title: response.story.title,
      content: response.story.content,
      originalStoryId: response.originalStoryId
    } as ResolvedPrivateStory;
  }
  
  //============ PUBLIC ROUTES ============
  
  const username = route.paramMap.get('username');
  const title = route.paramMap.get('title');
  
  if (username && !title) {
    const userId = await publicStories.resolveUsername(username);
    if (!userId) {
      throw new Error(`User "${username}" not found`);
    }
    
    return { userId } as ResolvedUser;
  }
  
  if (username && title) {
    const userId = await publicStories.resolveUsername(username);
    if (!userId) {
      throw new Error(`User "${username}" not found`);
    }
    
    const storyResolution = await publicStories.resolveStory(username, title);
    if (!storyResolution) {
      throw new Error(`Story "${title}" by ${username} not found`);
    }
    
    return {
      storyId: storyResolution.storyId,
      userId: userId
    } as ResolvedPublicStory;
  }
  
  //============ ERROR ============
  
  throw new Error(`Route not recognized: ${fullPath}`);
};