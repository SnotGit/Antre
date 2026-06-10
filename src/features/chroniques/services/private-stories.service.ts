import { Service, inject, resource, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from '@features/auth/services/auth.service';
import { EditStory, Story, PrivateStoriesResponse } from '../models/chroniques.models';

interface StoryDetailResponse {
  story: EditStory;
}

@Service()
export class PrivateStoriesService {

  //========== INJECTIONS ==========//

  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly STORIES_API = `${environment.apiUrl}/chroniques/stories`;

  //========== EDIT STATE ==========//

  readonly saveState = signal<'idle' | 'saved'>('idle');

  readonly editing = signal(false);

  //========== RESOURCES ==========//

  readonly publishedStories = resource({
    params: () => ({ userId: this.authService.currentUser()?.id ?? null }),
    loader: async ({ params }) => {
      if (params.userId === null) return [];
      const res = await firstValueFrom(this.http.get<PrivateStoriesResponse>(`${this.STORIES_API}/published`));
      return res.stories;
    }
  });

  readonly draftStories = resource({
    params: () => ({ userId: this.authService.currentUser()?.id ?? null }),
    loader: async ({ params }) => {
      if (params.userId === null) return [];
      const res = await firstValueFrom(this.http.get<PrivateStoriesResponse>(`${this.STORIES_API}/drafts`));
      return res.stories;
    }
  });

  //========== METHODS ==========//

  async getStoryDetail(id: number, isDraft: boolean): Promise<EditStory> {
    const url = isDraft
      ? `${this.STORIES_API}/drafts/${id}`
      : `${this.STORIES_API}/published/${id}`;
    const res = await firstValueFrom(this.http.get<StoryDetailResponse>(url));
    return res.story;
  }

  async createDraft(data: Partial<Story> = {}): Promise<number> {
    const res = await firstValueFrom(this.http.post<StoryDetailResponse>(`${this.STORIES_API}/drafts`, data));
    this.draftStories.reload();
    return res.story.id;
  }

  async saveDraft(id: number, data: Partial<Story>): Promise<void> {
    await firstValueFrom(this.http.put(`${this.STORIES_API}/drafts/${id}`, data));
    this.draftStories.reload();
  }

  async publishStory(id: number): Promise<void> {
    await firstValueFrom(this.http.post(`${this.STORIES_API}/drafts/${id}/publish`, {}));
    this.publishedStories.reload();
    this.draftStories.reload();
  }

  async republishFromDraft(id: number): Promise<void> {
    await firstValueFrom(this.http.post(`${this.STORIES_API}/drafts/${id}/republish`, {}));
    this.publishedStories.reload();
    this.draftStories.reload();
  }

  async deleteStory(id: number): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.STORIES_API}/${id}`));

    const isDraft = this.draftStories.value()?.some(s => s.id === id);
    const isPublished = this.publishedStories.value()?.some(s => s.id === id);

    if (isDraft) {
      this.draftStories.reload();
    }
    if (isPublished) {
      this.publishedStories.reload();
    }
    if (!isDraft && !isPublished) {
      this.publishedStories.reload();
      this.draftStories.reload();
    }
  }
}
