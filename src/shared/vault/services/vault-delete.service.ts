import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { AdminDialogService } from '@shared/services/dialog/admin-dialog.service';
import { VaultContextService } from './vault-context.service';

interface DeleteResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class VaultDeleteService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly adminDialogService = inject(AdminDialogService);
  private readonly context = inject(VaultContextService);

  //======= DELETE CATEGORY =======

  async deleteCategory(categoryId: number, categoryName: string): Promise<void> {
    const confirmed = await this.adminDialogService.confirmDelete([categoryName]);
    if (!confirmed) return;

    const apiUrl = `${environment.apiUrl}/${this.context.contextKey()}`;

    try {
      await firstValueFrom(
        this.http.delete<DeleteResponse>(`${apiUrl}/categories/${categoryId}`)
      );
      this.adminDialogService.showSuccessMessage();
    } catch (error) {
      this.adminDialogService.showErrorMessage();
      throw error;
    }
  }

  //======= DELETE ENTRY =======

  async deleteEntry(entryId: number, entryName: string): Promise<void> {
    const confirmed = await this.adminDialogService.confirmDelete([entryName]);
    if (!confirmed) return;

    const apiUrl = `${environment.apiUrl}/${this.context.contextKey()}`;

    try {
      await firstValueFrom(
        this.http.delete<DeleteResponse>(`${apiUrl}/entries/${entryId}`)
      );
      this.adminDialogService.showSuccessMessage();
    } catch (error) {
      this.adminDialogService.showErrorMessage();
      throw error;
    }
  }

  //======= BATCH DELETE CATEGORIES =======

  async deleteCategories(categoryIds: number[], categoryNames: string[]): Promise<void> {
    const confirmed = await this.adminDialogService.confirmDelete(categoryNames);
    if (!confirmed) return;

    const apiUrl = `${environment.apiUrl}/${this.context.contextKey()}`;

    try {
      await firstValueFrom(
        this.http.post<DeleteResponse>(`${apiUrl}/categories/batch-delete`, { categoryIds })
      );
      this.adminDialogService.showSuccessMessage();
    } catch (error) {
      this.adminDialogService.showErrorMessage();
      throw error;
    }
  }

  //======= BATCH DELETE ENTRIES =======

  async deleteEntries(entryIds: number[], entryNames: string[]): Promise<void> {
    const confirmed = await this.adminDialogService.confirmDelete(entryNames);
    if (!confirmed) return;

    const apiUrl = `${environment.apiUrl}/${this.context.contextKey()}`;

    try {
      await firstValueFrom(
        this.http.post<DeleteResponse>(`${apiUrl}/entries/batch-delete`, { entryIds })
      );
      this.adminDialogService.showSuccessMessage();
    } catch (error) {
      this.adminDialogService.showErrorMessage();
      throw error;
    }
  }
}
