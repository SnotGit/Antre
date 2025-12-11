import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { RoverCategory, CategoryWithChildren, CategoriesResponse } from '../models/rover.models';

//======= SERVICE =======

@Injectable({
  providedIn: 'root'
})
export class RoverGetService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/rover`;

  //======= GET ROOT CATEGORIES =======

  async getRootCategories(): Promise<RoverCategory[]> {
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
