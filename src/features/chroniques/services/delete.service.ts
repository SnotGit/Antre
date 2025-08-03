import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ConfirmationDialogService } from '../../../shared/utilities/confirmation-dialog/confirmation-dialog.service';

@Injectable({
  providedIn: 'root'
})
export class DeleteService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly API_URL = 'http://localhost:3000/api/private-stories';

  //======= DELETE METHOD =======

  async delete(id: number): Promise<void> {
    try {
      const confirmed = await this.confirmationService.confirmDeleteStory(false);
      if (!confirmed) return;

      await firstValueFrom(
        this.http.delete(`${this.API_URL}/deleteStory/${id}`)
      );
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  }

  //======= TOGGLE METHOD =======

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