import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { AdminDialogService } from '@shared/utilities/confirmation-dialog/admin-dialog.service';

interface DeleteResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class MarsballDeleteService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly adminDialogService = inject(AdminDialogService);
  private readonly API_URL = `${environment.apiUrl}/marsball`;

  //======= DELETE CATEGORY =======

  async deleteCategory(categoryId: number, categoryName: string): Promise<void> {
    const confirmed = await this.adminDialogService.confirmDelete([categoryName]);
    if (!confirmed) return;

    try {
      await firstValueFrom(
        this.http.delete<DeleteResponse>(`${this.API_URL}/categories/${categoryId}`)
      );
      this.adminDialogService.showSuccessMessage();
    } catch (error) {
      this.adminDialogService.showErrorMessage();
      throw error;
    }
  }

  //======= DELETE ITEM =======

  async deleteItem(itemId: number, itemName: string): Promise<void> {
    const confirmed = await this.adminDialogService.confirmDelete([itemName]);
    if (!confirmed) return;

    try {
      await firstValueFrom(
        this.http.delete<DeleteResponse>(`${this.API_URL}/items/${itemId}`)
      );
      this.adminDialogService.showSuccessMessage();
    } catch (error) {
      this.adminDialogService.showErrorMessage();
      throw error;
    }
  }

  //======= DELETE MULTIPLE CATEGORIES =======

  async deleteCategories(categoryIds: number[], categoryNames: string[]): Promise<void> {
    const confirmed = await this.adminDialogService.confirmDelete(categoryNames);
    if (!confirmed) return;

    try {
      await firstValueFrom(
        this.http.post<DeleteResponse>(`${this.API_URL}/categories/batch-delete`, {
          categoryIds
        })
      );
      this.adminDialogService.showSuccessMessage();
    } catch (error) {
      this.adminDialogService.showErrorMessage();
      throw error;
    }
  }

  //======= DELETE MULTIPLE ITEMS =======

  async deleteItems(itemIds: number[], itemNames: string[]): Promise<void> {
    const confirmed = await this.adminDialogService.confirmDelete(itemNames);
    if (!confirmed) return;

    try {
      await firstValueFrom(
        this.http.post<DeleteResponse>(`${this.API_URL}/items/batch-delete`, {
          itemIds
        })
      );
      this.adminDialogService.showSuccessMessage();
    } catch (error) {
      this.adminDialogService.showErrorMessage();
      throw error;
    }
  }
}