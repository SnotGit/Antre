import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { VaultCategory, CategoryWithChildren, CategoriesResponse } from '../models/vault.models';
import { VaultContextService } from './vault-context.service';

@Service()
export class VaultGetService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly context = inject(VaultContextService);

  //======= GET ROOT CATEGORIES =======

  async getRootCategories(): Promise<VaultCategory[]> {
    const apiUrl = `${environment.apiUrl}/${this.context.contextKey()}`;
    const response = await firstValueFrom(
      this.http.get<CategoriesResponse>(`${apiUrl}/categories`)
    );
    return response.categories;
  }

  //======= GET ALL CATEGORIES =======

  async getAllCategories(contextKey?: string): Promise<VaultCategory[]> {
    const key = contextKey ?? this.context.contextKey();
    const apiUrl = `${environment.apiUrl}/${key}`;
    const response = await firstValueFrom(
      this.http.get<CategoriesResponse>(`${apiUrl}/categories/all`)
    );
    return response.categories;
  }

  //======= GET CATEGORY WITH CHILDREN =======

  async getCategoryWithChildren(categoryId: number): Promise<CategoryWithChildren> {
    const apiUrl = `${environment.apiUrl}/${this.context.contextKey()}`;
    return await firstValueFrom(
      this.http.get<CategoryWithChildren>(`${apiUrl}/categories/${categoryId}`)
    );
  }
}
