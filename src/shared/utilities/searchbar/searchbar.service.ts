import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

export interface SearchResult {
  id: number;
  title: string;
  description?: string;
  category: string;
  type: 'chronique' | 'marsball' | 'rover' | 'bestiaire';
  route: string;
}

@Injectable({
  providedIn: 'root'
})
export class SearchbarService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  //======= SIGNALS =======

  searchQuery = signal<string>('');
  isOverlayOpen = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  //======= COMPUTED =======

  hasMinLength = computed(() => this.searchQuery().length >= 2);

  //======= METHODS =======

  setQuery(query: string): void {
    this.searchQuery.set(query);
  }

  clearQuery(): void {
    this.searchQuery.set('');
  }

  openOverlay(): void {
    this.isOverlayOpen.set(true);
  }

  closeOverlay(): void {
    this.isOverlayOpen.set(false);
    this.clearQuery();
  }

  toggleOverlay(): void {
    if (this.isOverlayOpen()) {
      this.closeOverlay();
    } else {
      this.openOverlay();
    }
  }

  //======= SEARCH LOGIC =======

  async search(query: string): Promise<SearchResult[]> {
    if (query.length < 2) {
      return [];
    }

    this.isLoading.set(true);

    try {
      const response = await firstValueFrom(
        this.http.get<{ results: SearchResult[] }>(
          `${this.API_URL}/search?q=${encodeURIComponent(query)}`
        )
      );

      this.isLoading.set(false);
      return response?.results || [];
    } catch (error) {
      console.error('Erreur recherche:', error);
      this.isLoading.set(false);
      return [];
    }
  }
}
