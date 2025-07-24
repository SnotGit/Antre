import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { PrivateStoriesService } from '../services/private-stories.service';

export interface StoryData {
  story: {
    title: string;
    content: string;
  };
  mode: 'NewStory' | 'EditDraft' | 'EditPublished';
  storyId: number | null;
  originalStoryId: number | null;
}

//============ EDITOR RESOLVER ============

export const editorResolver: ResolveFn<StoryData> = async (route) => {
  const storiesService = inject(PrivateStoriesService);
  const url = route.url.join('/');
  
  // Nouvelle histoire
  if (url.includes('nouvelle-histoire')) {
    return {
      story: { title: '', content: '' },
      mode: 'NewStory',
      storyId: null,
      originalStoryId: null
    };
  }
  
  const title = route.paramMap.get('title');
  if (!title) {
    throw new Error('Titre manquant');
  }
  
  // Édition brouillon
  if (url.includes('brouillon')) {
    const response = await storiesService.getStoryForEdit(parseInt(title));
    if (!response) {
      throw new Error('Brouillon non trouvé');
    }
    
    return {
      story: {
        title: response.story.title,
        content: response.story.content
      },
      mode: 'EditDraft',
      storyId: response.story.id,
      originalStoryId: null
    };
  }
  
  // Édition histoire publiée
  if (url.includes('publiée')) {
    const response = await storiesService.getStoryForEdit(parseInt(title));
    if (!response) {
      throw new Error('Histoire non trouvée');
    }
    
    return {
      story: {
        title: response.story.title,
        content: response.story.content
      },
      mode: 'EditPublished',
      storyId: response.story.id,
      originalStoryId: response.originalStoryId || null
    };
  }
  
  throw new Error('Mode éditeur non reconnu');
};