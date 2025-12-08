import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { BestiaireCategory, CategoriesResponse, CategoryWithCreatures } from '@features/marsball/bestiaire/models/bestiaire.models';

@Injectable({
  providedIn: 'root'
})
export class BestiaireGetService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/bestiaire`;

  //======= GET ROOT CATEGORIES =======

  async getRootCategories(): Promise<BestiaireCategory[]> {
    const response = await firstValueFrom(
      this.http.get<CategoriesResponse>(`${this.API_URL}/categories`)
    );
    return response.categories;
  }

  //======= GET CATEGORY WITH CREATURES =======

  async getCategoryWithCreatures(categoryId: number): Promise<CategoryWithCreatures> {
    return await firstValueFrom(
      this.http.get<CategoryWithCreatures>(`${this.API_URL}/categories/${categoryId}`)
    );
  }
}