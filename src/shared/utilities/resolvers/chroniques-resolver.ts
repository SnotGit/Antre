import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { LoadService } from '@features/chroniques/services/load.service';

interface ResolverData {
  storyId: number;
  userId?: number;
  title?: string;
  content?: string;
}

export const chroniquesResolver: ResolveFn<ResolverData | null> = async (route) => {
  const http = inject(HttpClient);
  const loadService = inject(LoadService);
  const API_URL = `${environment.apiUrl}/chroniques`;
  
  const username = route.paramMap.get('username');
  const title = route.paramMap.get('title');
  
  //============ ROUTE PRIVÉE ÉDITION ============
  if (title && !username) {
    const response = await firstValueFrom(
      http.get<{ storyId: number }>(`${API_URL}/private/resolve/title/${title}`)
    );
    
    const story = await loadService.getStoryForEdit(response.storyId);
    
    return {
      storyId: story.id,
      title: story.title,
      content: story.content
    };
  }
  
  //============ ROUTE PUBLIQUE LECTURE ============
  if (username && title) {
    const [userResponse, storyResponse] = await Promise.all([
      firstValueFrom(http.get<{ userId: number }>(`${API_URL}/resolve/username/${username}`)),
      firstValueFrom(http.get<{ storyId: number }>(`${API_URL}/resolve/story/${username}/${title}`))
    ]);
    
    return {
      storyId: storyResponse.storyId,
      userId: userResponse.userId
    };
  }
  
  //============ AUCUNE RÉSOLUTION ============
  return null;
};