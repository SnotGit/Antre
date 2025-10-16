import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { ConfirmationDialogService } from './confirmation-dialog.service';

interface DeleteResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class MarsballDeleteService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly API_URL = `${environment.apiUrl}/marsball`;

  //======= DELETE CATEGORY =======

  async deleteCategory(categoryId: number, categoryName: string): Promise<void> {
    const confirmed = await this.confirmationService.confirmDeleteCategory([categoryName]);
    if (!confirmed) return;

    try {
      await firstValueFrom(
        this.http.delete<DeleteResponse>(`${this.API_URL}/categories/${categoryId}`)
      );
      this.confirmationService.showSuccessMessage();
    } catch (error) {
      this.confirmationService.showErrorMessage();
      throw error;
    }
  }

  //======= DELETE ITEM =======

  async deleteItem(itemId: number, itemName: string): Promise<void> {
    const confirmed = await this.confirmationService.confirmDeleteItem([itemName]);
    if (!confirmed) return;

    try {
      await firstValueFrom(
        this.http.delete<DeleteResponse>(`${this.API_URL}/items/${itemId}`)
      );
      this.confirmationService.showSuccessMessage();
    } catch (error) {
      this.confirmationService.showErrorMessage();
      throw error;
    }
  }

  //======= DELETE MULTIPLE CATEGORIES =======

  async deleteCategories(categoryIds: number[], categoryNames: string[]): Promise<void> {
    const confirmed = await this.confirmationService.confirmDeleteCategory(categoryNames);
    if (!confirmed) return;

    try {
      await firstValueFrom(
        this.http.post<DeleteResponse>(`${this.API_URL}/categories/batch-delete`, {
          categoryIds
        })
      );
      this.confirmationService.showSuccessMessage();
    } catch (error) {
      this.confirmationService.showErrorMessage();
      throw error;
    }
  }

  //======= DELETE MULTIPLE ITEMS =======

  async deleteItems(itemIds: number[], itemNames: string[]): Promise<void> {
    const confirmed = await this.confirmationService.confirmDeleteItem(itemNames);
    if (!confirmed) return;

    try {
      await firstValueFrom(
        this.http.post<DeleteResponse>(`${this.API_URL}/items/batch-delete`, {
          itemIds
        })
      );
      this.confirmationService.showSuccessMessage();
    } catch (error) {
      this.confirmationService.showErrorMessage();
      throw error;
    }
  }
}