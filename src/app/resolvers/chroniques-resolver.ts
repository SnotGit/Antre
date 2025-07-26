import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { PrivateStoriesService } from '../services/private-stories.service';
import { PublicStoriesService } from '../services/public-stories.service';

export interface PrivateStoryData {
  story: {
    title: string;
    content: string;
  };
  mode: 'EditNew' | 'EditDraft' | 'EditPublished';
  storyId: number | null;
  originalStoryId: number | null;
}

export interface PublicStoryData {
  storyId: number;
  userId: number;
}

export interface UserProfileData {
  userId: number;
}

export type ChroniquesData = PrivateStoryData | PublicStoryData | UserProfileData;

//============ RESOLVER ============

export const chroniquesResolver: ResolveFn<ChroniquesData> = async (route) => {
  const privateStoriesService = inject(PrivateStoriesService);
  const publicStoriesService = inject(PublicStoriesService);
  const url = route.url.join('/');
  
  //============ ROUTES PRIVÉES ============
  
  if (url.includes('nouvelle-histoire')) {
    return {
      story: { title: '', content: '' },
      mode: 'EditNew',
      storyId: null,
      originalStoryId: null
    } as PrivateStoryData;
  }
  
  if (url.includes('brouillon') || url.includes('publiée')) {
    const title = route.paramMap.get('title');
    if (!title) {
      throw new Error('Titre manquant');
    }
    
    //============ CORRECTION: RÉSOUDRE TITRE EN ID ============
    const resolution = await privateStoriesService.resolveTitle(title);
    if (!resolution) {
      throw new Error('Histoire non trouvée');
    }
    
    const response = await privateStoriesService.getStoryForEdit(resolution.id);
    if (!response) {
      throw new Error('Histoire non trouvée');
    }
    
    return {
      story: {
        title: response.story.title,
        content: response.story.content
      },
      mode: url.includes('brouillon') ? 'EditDraft' : 'EditPublished',
      storyId: response.story.id,
      originalStoryId: response.originalStoryId || null
    } as PrivateStoryData;
  }

  //============ ROUTE EDITOR BY ID ============
  
  if (url.includes('editor')) {
    const idParam = route.paramMap.get('id');
    if (!idParam) {
      throw new Error('ID manquant');
    }
    
    const storyId = parseInt(idParam);
    if (isNaN(storyId)) {
      throw new Error('ID invalide');
    }
    
    const response = await privateStoriesService.getStoryForEdit(storyId);
    if (!response) {
      throw new Error('Histoire non trouvée');
    }
    
    return {
      story: {
        title: response.story.title,
        content: response.story.content
      },
      mode: 'EditDraft',
      storyId: response.story.id,
      originalStoryId: response.originalStoryId || null
    } as PrivateStoryData;
  }
  
  //============ ROUTES PUBLIQUES ============
  
  const username = route.paramMap.get('username');
  const title = route.paramMap.get('title');
  
  if (username && !title) {
    const userId = await publicStoriesService.resolveUsername(username);
    if (!userId) {
      throw new Error(`Utilisateur "${username}" non trouvé`);
    }
    
    return {
      userId: userId
    } as UserProfileData;
  }
  
  if (username && title) {
    const userId = await publicStoriesService.resolveUsername(username);
    if (!userId) {
      throw new Error(`Utilisateur "${username}" non trouvé`);
    }
    
    const storyResolution = await publicStoriesService.resolveStory(username, title);
    if (!storyResolution) {
      throw new Error(`Histoire "${title}" non trouvée`);
    }
    
    return {
      storyId: storyResolution.storyId,
      userId: userId
    } as PublicStoryData;
  }
  
  throw new Error('Route non reconnue');
};