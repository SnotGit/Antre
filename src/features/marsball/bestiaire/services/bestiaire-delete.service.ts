import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BestiaireDeleteService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/bestiaire`;

  //======= DELETE CATEGORY =======

  async deleteCategory(categoryId: number): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.API_URL}/categories/${categoryId}`)
    );
  }

  //======= BATCH DELETE CATEGORIES =======

  async batchDeleteCategories(ids: number[]): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.API_URL}/categories/batch-delete`, { ids })
    );
  }

  //======= DELETE CREATURE =======

  async deleteCreature(creatureId: number): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.API_URL}/creatures/${creatureId}`)
    );
  }

  //======= BATCH DELETE CREATURES =======

  async batchDeleteCreatures(ids: number[]): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.API_URL}/creatures/batch-delete`, { ids })
    );
  }
}