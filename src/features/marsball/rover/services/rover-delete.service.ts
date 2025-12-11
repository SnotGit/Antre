import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

//======= SERVICE =======

@Injectable({
  providedIn: 'root'
})
export class RoverDeleteService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/rover`;

  //======= DELETE CATEGORY =======

  async deleteCategory(categoryId: number): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.API_URL}/categories/${categoryId}`)
    );
  }

  //======= DELETE ITEM =======

  async deleteItem(itemId: number): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.API_URL}/items/${itemId}`)
    );
  }

  //======= BATCH DELETE CATEGORIES =======

  async batchDeleteCategories(categoryIds: number[]): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.API_URL}/categories/batch-delete`, { ids: categoryIds })
    );
  }

  //======= BATCH DELETE ITEMS =======

  async batchDeleteItems(itemIds: number[]): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.API_URL}/items/batch-delete`, { ids: itemIds })
    );
  }
}
