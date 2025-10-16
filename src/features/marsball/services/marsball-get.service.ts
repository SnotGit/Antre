import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

//======= INTERFACES =======

export interface MarsballCategory {
  id: number;
  title: string;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarsballItem {
  id: number;
  title: string;
  imageUrl: string;
  description: string;
  thumbnailUrl: string;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryWithChildren {
  category: MarsballCategory;
  children: MarsballCategory[];
  items: MarsballItem[];
}

//======= RESPONSE TYPES =======

interface CategoriesResponse {
  categories: MarsballCategory[];
}

//======= SERVICE =======

@Injectable({
  providedIn: 'root'
})
export class MarsballGetService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/marsball`;

  //======= GET ROOT CATEGORIES =======

  async getRootCategories(): Promise<MarsballCategory[]> {
    const response = await firstValueFrom(
      this.http.get<CategoriesResponse>(`${this.API_URL}/categories`)
    );
    return response.categories;
  }

  //======= GET CATEGORY WITH CHILDREN =======

  async getCategoryWithChildren(categoryId: number): Promise<CategoryWithChildren> {
    return await firstValueFrom(
      this.http.get<CategoryWithChildren>(`${this.API_URL}/categories/${categoryId}`)
    );
  }
}