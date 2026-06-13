import { Service, inject, resource, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

//========== TYPES ==========//

export interface SearchResultCategory {
  kind: 'category';
  section: string;
  id: number;
  title: string;
  itemCount: number;
  route: string;
}

export interface SearchResultItem {
  kind: 'item';
  section: string;
  id: number;
  title: string;
  description: string;
  category: string;
  categoryId: number;
  imageUrl: string;
  route: string;
  score: number;
}

export type SearchResult = SearchResultCategory | SearchResultItem;

export interface SearchGroup {
  section: string;
  categories: SearchResultCategory[];
  items: SearchResultItem[];
}

//========== SERVICE ==========//

@Service()
export class ElenaSearchService {

  //========== INJECTIONS ==========//

  private readonly http = inject(HttpClient);

  //========== SIGNALS ==========//

  readonly query = signal<string>('');

  //========== RESOURCE ==========//

  private readonly searchResource = resource({
    params: () => {
      const q = this.query().trim();
      return q.length >= 2 ? { q } : undefined;
    },
    loader: async ({ params }) => {
      const response = await firstValueFrom(
        this.http.post<{ results: SearchResult[] }>(
          `${environment.apiUrl}/elena/search`,
          { query: params.q }
        )
      );
      return response.results;
    }
  });

  //========== COMPUTED ==========//

  readonly results = computed<SearchResult[]>(() => this.searchResource.value() ?? []);
  readonly isLoading = computed(() => this.searchResource.isLoading());
  readonly isResolved = computed(() => this.searchResource.status() === 'resolved');

  readonly itemCount = computed(() =>
    this.results().filter(r => r.kind === 'item').length
  );

  readonly categoryCount = computed(() =>
    this.results().filter(r => r.kind === 'category').length
  );

  readonly groups = computed<SearchGroup[]>(() => {
    const results = this.results();
    const map = new Map<string, SearchGroup>();

    for (const r of results) {
      if (!map.has(r.section)) {
        map.set(r.section, { section: r.section, categories: [], items: [] });
      }
      const group = map.get(r.section)!;
      if (r.kind === 'category') {
        group.categories.push(r);
      } else {
        group.items.push(r);
      }
    }

    return Array.from(map.values());
  });
}
