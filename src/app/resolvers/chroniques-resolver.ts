import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { PrivateStoriesService } from '../services/private-stories.service';
import { PublicStoriesService } from '../services/public-stories.service';

export interface PrivateStoryData {
  story: {
    title: string;
    content: string;
  };
  mode: 'NewStory' | 'EditDraft' | 'EditPublished';
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

//============ CHRONIQUES RESOLVER AVEC DEBUG ============

export const chroniquesResolver: ResolveFn<ChroniquesData> = async (route) => {
  const privateStoriesService = inject(PrivateStoriesService);
  const publicStoriesService = inject(PublicStoriesService);
  const url = route.url.join('/');
  
  //============ ROUTES PRIVÉES ============
  
  if (url.includes('nouvelle-histoire')) {
    return {
      story: { title: '', content: '' },
      mode: 'NewStory',
      storyId: null,
      originalStoryId: null
    } as PrivateStoryData;
  }
  
  if (url.includes('brouillon') || url.includes('publiée')) {
    const title = route.paramMap.get('title');
    if (!title) {
      throw new Error('Titre manquant');
    }
    
    const response = await privateStoriesService.getStoryForEdit(parseInt(title));
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
  
  //============ ROUTES PUBLIQUES AVEC DEBUG ============
  
  const username = route.paramMap.get('username');
  const title = route.paramMap.get('title');
  
  if (username && !title) {
    console.log('🔍 RESOLVER DEBUG: Résolution username =', username);
    
    const userId = await publicStoriesService.resolveUsername(username);
    console.log('🔍 RESOLVER DEBUG: userId retourné =', userId);
    
    if (!userId) {
      console.error(`🚨 RESOLVER: Username "${username}" non trouvé en BDD`);
      console.error('🔧 Solutions possibles:');
      console.error(`   1. Vérifier si username="${username}" existe en BDD`);
      console.error('   2. Corriger le username en BDD si nécessaire');
      console.error('   3. Vérifier l\'URL de navigation');
      
      throw new Error(`Utilisateur "${username}" non trouvé en base de données`);
    }
    
    return {
      userId: userId
    } as UserProfileData;
  }
  
  if (username && title) {
    console.log('🔍 RESOLVER DEBUG: Résolution story =', { username, title });
    
    const userId = await publicStoriesService.resolveUsername(username);
    console.log('🔍 RESOLVER DEBUG: userId pour story =', userId);
    
    if (!userId) {
      console.error(`🚨 RESOLVER: Username "${username}" non trouvé pour story "${title}"`);
      throw new Error(`Utilisateur "${username}" non trouvé en base de données`);
    }
    
    const storyResolution = await publicStoriesService.resolveStory(username, title);
    console.log('🔍 RESOLVER DEBUG: storyResolution =', storyResolution);
    
    if (!storyResolution) {
      throw new Error(`Histoire "${title}" non trouvée pour utilisateur "${username}"`);
    }
    
    return {
      storyId: storyResolution.storyId,
      userId: userId
    } as PublicStoryData;
  }
  
  throw new Error('Route non reconnue');
};