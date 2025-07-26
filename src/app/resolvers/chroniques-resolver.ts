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
  const url = route.url.join('/');
    
  //============ PRIVATE ROUTES ============
  
  if (url.includes('nouvelle-histoire')) {
    return null;
  }
  
  if (url.includes('brouillon') || url.includes('publiée')) {
    const title = route.paramMap.get('title');
    if (!title) throw new Error('Titre manquant');
    
    const resolution = await privateStories.resolveTitle(title);
    if (!resolution) throw new Error('Histoire non trouvée');
    
    const response = await privateStories.getStory(resolution.id);
    if (!response) throw new Error('Histoire non trouvée');
    
    return {
      storyId: response.story.id,
      title: response.story.title,
      content: response.story.content,
      originalStoryId: response.originalStoryId
    } as ResolvedPrivateStory;
  }

  if (url.includes('editor')) {
    const idParam = route.paramMap.get('id');
    if (!idParam) throw new Error('ID manquant');
    
    const storyId = parseInt(idParam);
    if (isNaN(storyId)) throw new Error('ID invalide');
    
    const response = await privateStories.getStory(storyId);
    if (!response) throw new Error('Histoire non trouvée');
    
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
    if (!userId) throw new Error(`Utilisateur "${username}" non trouvé`);
    
    return { userId } as ResolvedUser;
  }
  
  if (username && title) {
    const userId = await publicStories.resolveUsername(username);
    if (!userId) throw new Error(`Utilisateur "${username}" non trouvé`);
    
    const storyResolution = await publicStories.resolveStory(username, title);
    if (!storyResolution) throw new Error(`Histoire "${title}" non trouvée`);
    
    return {
      storyId: storyResolution.storyId,
      userId: userId
    } as ResolvedPublicStory;
  }
  
  throw new Error('Route non reconnue');
};