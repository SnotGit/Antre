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
export class MarsballCreateService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/marsball`;

  //======= CREATE CATEGORY =======

  async createCategory(title: string, parentId: number | null): Promise<MarsballCategory> {
    try {
      const response = await firstValueFrom(
        this.http.post<CategoryResponse>(`${this.API_URL}/categories`, { title, parentId })
      );
      return response.category;
    } catch (error) {
      throw error;
    }
  }

  //======= CREATE ITEM =======

  async createItem(title: string, categoryId: number, image: File): Promise<MarsballItem> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('categoryId', categoryId.toString());
    formData.append('image', image);

    try {
      const response = await firstValueFrom(
        this.http.post<ItemResponse>(`${this.API_URL}/items`, formData)
      );
      return response.item;
    } catch (error) {
      throw error;
    }
  }
}