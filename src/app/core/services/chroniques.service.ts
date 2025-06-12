import { Injectable, computed } from '@angular/core';
import { httpResource } from '@angular/common/http';

export interface UserLatestStory {
  id: number;
  username: string;
  description: string;
  avatar: string | null;
  latestStory: {
    id: number;
    title: string;
    slug: string;
    publishedAt: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ChroniquesService {
  private readonly API_URL = 'http://localhost:3000/api';

  //============ HTTP RESOURCE ============
  private resource = httpResource<{message: string, users: UserLatestStory[]}>(() => 
    `${this.API_URL}/chroniques/latest-stories`
  );

  //============ SIGNALS ============
  users = computed(() => this.resource.value()?.users ?? []);
  loading = this.resource.isLoading;
  error = this.resource.error;
}