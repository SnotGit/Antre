import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface EditStoryData {
  story: {
    id: number;
    title: string;
    content: string;
  };
  originalStoryId?: number;
}

export const editStoryResolver: ResolveFn<EditStoryData> = async (route) => {
  const http = inject(HttpClient);
  const title = route.paramMap.get('title')!;
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Token d\'authentification manquant');
  }

  const headers = {
    'Authorization': `Bearer ${token}`
  };

  // Étape 1: Résoudre titre → ID + status
  const findResponse = await firstValueFrom(
    http.get<{ id: number; status: string }>(`http://localhost:3000/api/user/stories/find/${title}`, { headers })
  );
  
  // Étape 2: Récupérer selon le type (draft ou published)
  let endpoint: string;
  if (findResponse.status === 'DRAFT') {
    endpoint = `/api/user/stories/draft/${findResponse.id}`;
  } else {
    endpoint = `/api/user/stories/published-to-draft/${findResponse.id}`;
  }
  
  const storyResponse = await firstValueFrom(
    http.get<EditStoryData>(endpoint, { headers })
  );
  
  return storyResponse;
};