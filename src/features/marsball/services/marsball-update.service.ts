import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { MarsballCategory, MarsballItem } from './marsball-get.service';

//======= RESPONSE TYPES =======

interface CategoryResponse {
  category: MarsballCategory;
}

interface ItemResponse {
  item: MarsballItem;
}

//======= SERVICE =======

@Injectable({
  providedIn: 'root'
})
export class MarsballUpdateService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/marsball`;

  //======= UPDATE CATEGORY =======

  async updateCategory(categoryId: number, title: string): Promise<MarsballCategory> {
    try {
      const response = await firstValueFrom(
        this.http.put<CategoryResponse>(`${this.API_URL}/categories/${categoryId}`, { title })
      );
      return response.category;
    } catch (error) {
      throw error;
    }
  }

  //======= UPDATE ITEM =======

  async updateItem(itemId: number, title: string, description: string, image?: File, cropX?: number, cropY?: number, cropSize?: number): Promise<MarsballItem> {
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      
      if (image && cropX !== undefined && cropY !== undefined && cropSize !== undefined) {
        formData.append('image', image);
        formData.append('cropX', cropX.toString());
        formData.append('cropY', cropY.toString());
        formData.append('cropSize', cropSize.toString());
      }

      const response = await firstValueFrom(
        this.http.put<ItemResponse>(`${this.API_URL}/items/${itemId}`, formData)
      );
      return response.item;
    } catch (error) {
      throw error;
    }
  }
}