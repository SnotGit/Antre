import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { ConfirmationDialogService } from '@shared/services/confirmation-dialog.service';

@Injectable({
  providedIn: 'root'
})
export class DeleteService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly API_URL = `${environment.apiUrl}/chroniques`;

  //======= DELETE STORY =======

  async deleteStory(id: number): Promise<void> {
    try {
      const confirmed = await this.confirmationService.confirmDeleteStory(false);
      if (!confirmed) return;

      await firstValueFrom(
        this.http.delete(`${this.API_URL}/stories/drafts/${id}`)
      );
    } catch (error) {
      throw error;
    }
  }

  //======= DELETE SELECTED =======

  async deleteSelected(selectedIds: number[]): Promise<void> {
    if (selectedIds.length === 0) return;

    try {
      const confirmed = await this.confirmationService.confirmDeleteMultiple(selectedIds.length);
      if (!confirmed) return;

      await Promise.all(
        selectedIds.map(id =>
          firstValueFrom(this.http.delete(`${this.API_URL}/stories/drafts/${id}`))
        )
      );
    } catch (error) {
      throw error;
    }
  }

  //======= TOGGLE =======

  toggle(id: number, selectedSet: Set<number>): Set<number> {
    const newSet = new Set(selectedSet);

    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }

    return newSet;
  }
}