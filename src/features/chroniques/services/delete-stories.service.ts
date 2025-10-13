import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { ConfirmationDialogService } from './confirmation-dialog.service';

//======= TYPES =======

export type StoryType = 'draft' | 'published';

//======= SUCCESS RESPONSE =======

export interface DeleteResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class DeleteStoriesService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly API_URL = `${environment.apiUrl}/chroniques`;

  //======= HELPERS =======

  private async executeHttpRequest<T>(request: Promise<T>): Promise<T> {
    try {
      return await request;
    } catch (error) {
      throw error;
    }
  }

  private buildDeleteUrl(type: StoryType, id: number): string {
    return `${this.API_URL}/stories/${type === 'draft' ? 'drafts' : 'published'}/${id}`;
  }

  //======= DELETE SINGLE STORY =======

  async deleteStory(id: number, type: StoryType = 'draft'): Promise<void> {
    const confirmed = await this.confirmationService.confirmDeleteStory(type === 'published');
    if (!confirmed) return;

    await this.executeHttpRequest(
      firstValueFrom(
        this.http.delete<DeleteResponse>(this.buildDeleteUrl(type, id))
      )
    );
  }

  //======= DELETE SELECTION =======

  async deleteSelection(selectedIds: number[], type: StoryType = 'draft'): Promise<void> {
    if (selectedIds.length === 0) return;

    const confirmed = await this.confirmationService.confirmDeleteSelection(selectedIds.length);
    if (!confirmed) return;

    await this.executeHttpRequest(
      Promise.all(
        selectedIds.map(id =>
          firstValueFrom(
            this.http.delete<DeleteResponse>(this.buildDeleteUrl(type, id))
          )
        )
      )
    );
  }

  //======= SELECTION UTILS =======

  toggleSelection(id: number, selectedSet: Set<number>): Set<number> {
    const newSet = new Set(selectedSet);

    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }

    return newSet;
  }
}