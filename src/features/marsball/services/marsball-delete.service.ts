import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { ConfirmationDialogService } from './confirmation-dialog.service';

//======= RESPONSE TYPES =======

interface DeleteResponse {
  message: string;
}

//======= SERVICE =======

@Injectable({
  providedIn: 'root'
})
export class MarsballDeleteService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly API_URL = `${environment.apiUrl}/marsball`;

  //======= DELETE CATEGORY =======

  async deleteCategory(categoryId: number): Promise<void> {
    const confirmed = await this.confirmationService.confirmDeleteCategory();
    if (!confirmed) return;

    try {
      await firstValueFrom(
        this.http.delete<DeleteResponse>(`${this.API_URL}/categories/${categoryId}`)
      );
    } catch (error) {
      throw error;
    }
  }

  //======= DELETE ITEM =======

  async deleteItem(itemId: number): Promise<void> {
    const confirmed = await this.confirmationService.confirmDeleteItem();
    if (!confirmed) return;

    try {
      await firstValueFrom(
        this.http.delete<DeleteResponse>(`${this.API_URL}/items/${itemId}`)
      );
    } catch (error) {
      throw error;
    }
  }
}