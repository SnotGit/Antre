import { Injectable, inject, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { EditStory, Story, PrivateStoriesResponse } from '../models/chroniques.models';

@Injectable({
  providedIn: 'root'
})

export class PrivateStoriesService {

  //========== INJECTIONS ==========//

  private readonly http = inject(HttpClient);

  //========== RESOURCES ==========//

  readonly publishedStories = resource({
    loader: async () => {
      const res = await firstValueFrom(this.http.get<PrivateStoriesResponse>('/api/chroniques/stories/published'));
      return res.stories;
    }
  });

  readonly draftStories = resource({
    loader: async () => {
      const res = await firstValueFrom(this.http.get<PrivateStoriesResponse>('/api/chroniques/stories/drafts'));
      return res.stories;
    }
  });

  //========== METHODS ==========//

  async getStoryDetail(id: number, isDraft: boolean): Promise<EditStory> {
    const url = isDraft
      ? `/api/chroniques/stories/drafts/${id}`
      : `/api/chroniques/stories/published/${id}`;
    return firstValueFrom(this.http.get<EditStory>(url));
  }

  async createDraft(data: Partial<Story>): Promise<void> {
    await firstValueFrom(this.http.post('/api/chroniques/stories/drafts', data));
    this.draftStories.reload();
  }

  async saveDraft(id: number, data: Partial<Story>): Promise<void> {
    await firstValueFrom(this.http.put(`/api/chroniques/stories/drafts/${id}`, data));
    this.draftStories.reload();
  }

  async publishStory(id: number): Promise<void> {
    await firstValueFrom(this.http.post(`/api/chroniques/stories/drafts/${id}/publish`, {}));
    this.publishedStories.reload();
    this.draftStories.reload();
  }

  async republishFromDraft(id: number): Promise<void> {
    await firstValueFrom(this.http.post(`/api/chroniques/stories/drafts/${id}/republish`, {}));
    this.publishedStories.reload();
    this.draftStories.reload();
  }

  async deleteStory(id: number): Promise<void> {
    await firstValueFrom(this.http.delete(`/api/chroniques/stories/${id}`));

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
