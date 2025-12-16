import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { AdminDialogService } from '@shared/services/dialog/admin-dialog.service';

@Injectable({
  providedIn: 'root'
})
export class BestiaireDeleteService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly adminDialogService = inject(AdminDialogService);
  private readonly API_URL = `${environment.apiUrl}/bestiaire`;

  //======= DELETE CATEGORY =======

  async deleteCategory(categoryId: number, categoryName: string): Promise<void> {
    const confirmed = await this.adminDialogService.confirmDelete([categoryName]);
    if (!confirmed) return;

    try {
      await firstValueFrom(
        this.http.delete(`${this.API_URL}/categories/${categoryId}`)
      );
      this.adminDialogService.showSuccessMessage();
    } catch (error) {
      this.adminDialogService.showErrorMessage();
      throw error;
    }
  }

  //======= BATCH DELETE CATEGORIES =======

  async batchDeleteCategories(ids: number[], names: string[]): Promise<void> {
    const confirmed = await this.adminDialogService.confirmDelete(names);
    if (!confirmed) return;

    try {
      await firstValueFrom(
        this.http.post(`${this.API_URL}/categories/batch-delete`, { ids })
      );
      this.adminDialogService.showSuccessMessage();
    } catch (error) {
      this.adminDialogService.showErrorMessage();
      throw error;
    }
  }

  //======= DELETE CREATURE =======

  async deleteCreature(creatureId: number, creatureName: string): Promise<void> {
    const confirmed = await this.adminDialogService.confirmDelete([creatureName]);
    if (!confirmed) return;

    try {
      await firstValueFrom(
        this.http.delete(`${this.API_URL}/creatures/${creatureId}`)
      );
      this.adminDialogService.showSuccessMessage();
    } catch (error) {
      this.adminDialogService.showErrorMessage();
      throw error;
    }
  }

  //======= BATCH DELETE CREATURES =======

  async batchDeleteCreatures(ids: number[], names: string[]): Promise<void> {
    const confirmed = await this.adminDialogService.confirmDelete(names);
    if (!confirmed) return;

    try {
      await firstValueFrom(
        this.http.post(`${this.API_URL}/creatures/batch-delete`, { ids })
      );
      this.adminDialogService.showSuccessMessage();
    } catch (error) {
      this.adminDialogService.showErrorMessage();
      throw error;
    }
  }
}