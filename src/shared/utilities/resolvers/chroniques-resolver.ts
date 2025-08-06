import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { LoadService } from '@features/chroniques/services/load.service';

interface PrivateStoryResolve {
  storyId: number;
  title: string;
  content: string;
}

interface PublicStoryResolve {
  storyId: number;
  userId: number;
}

interface UserResolve {
  userId: number;
}

type ResolvedData = PrivateStoryResolve | PublicStoryResolve | UserResolve | null;

//============ RESOLVER ============

export const chroniquesResolver: ResolveFn<ResolvedData> = async (route) => {
  const http = inject(HttpClient);
  const loadService = inject(LoadService);
  const API_URL = `${environment.apiUrl}/chroniques`;
  
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
    
    try {
      const response = await firstValueFrom(
        http.get<{ storyId: number }>(`${API_URL}/private/resolve/title/${title}`)
      );
      
      const isDraft = segments.includes('brouillon');
      const story = isDraft 
        ? await loadService.getDraftStory(response.storyId)
        : await loadService.getPublishedStory(response.storyId);
      
      return {
        storyId: story.id,
        title: story.title,
        content: story.content
      } as PrivateStoryResolve;
      
    } catch (error) {
      throw new Error(`Story "${title}" not found`);
    }
  }
  
  //============ PUBLIC ROUTES ============
  
  const username = route.paramMap.get('username');
  const title = route.paramMap.get('title');
  
  if (username && !title) {
    try {
      const response = await firstValueFrom(
        http.get<{ userId: number }>(`${API_URL}/resolve/username/${username}`)
      );
      
      return { userId: response.userId } as UserResolve;
      
    } catch (error) {
      throw new Error(`User "${username}" not found`);
    }
  }
  
  if (username && title) {
    try {
      const [userResponse, storyResponse] = await Promise.all([
        firstValueFrom(http.get<{ userId: number }>(`${API_URL}/resolve/username/${username}`)),
        firstValueFrom(http.get<{ storyId: number }>(`${API_URL}/resolve/story/${username}/${title}`))
      ]);
      
      return {
        storyId: storyResponse.storyId,
        userId: userResponse.userId
      } as PublicStoryResolve;
      
    } catch (error) {
      throw new Error(`Story "${title}" by ${username} not found`);
    }
  }
  
  //============ ERROR ============
  
  throw new Error(`Route not recognized: ${fullPath}`);
};