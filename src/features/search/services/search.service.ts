import { Service, inject, resource, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { MarsballCrudService } from '@features/marsball/services/marsball-crud.service';
import { VaultCategory, VaultEntry } from '@features/marsball/models/marsball.models';
import { SearchFiltersService, SearchSection } from './search-filters.service';
import { SECTIONS_BY_UNIVERSE } from './search-config';

export interface ResultCard {
  id: number;
  title: string;
  imageUrl: string;
  kind: 'entry' | 'category' | 'section';
  categoryId: number;
  sectionKey?: SearchSection;
}

export interface SearchHit {
  id: number;
  title: string;
  description: string;
  category: string;
  type: string;
  route: string;
  imageUrl?: string;
}

@Service()
export class SearchService {

  private readonly filters = inject(SearchFiltersService);
  private readonly crud = inject(MarsballCrudService);
  private readonly http = inject(HttpClient);

  readonly apiHost = environment.apiUrl.replace(/\/api$/, '');

  private readonly cardsResource = resource({
    params: () => {
      const universe = this.filters.universe();
      if (!universe) return undefined;

      const section = this.filters.section();
      if (!section) {
        return { mode: 'sections' as const, universe };
      }

      return {
        mode: 'categories' as const,
        section,
        catId: this.filters.categoryId() || null,
        subId: this.filters.subCategoryId() || null
      };
    },
    loader: async ({ params }) => {
      if (params.mode === 'sections') {
        return SECTIONS_BY_UNIVERSE[params.universe].map(s => this.toSectionCard(s));
      }

      const targetId = params.subId ?? params.catId;
      if (targetId === null) {
        const cats = await this.crud.getAllCategories(params.section);
        return cats.filter(c => c.parentId === null).map(c => this.toCategoryCard(c));
      }
      const data = await this.crud.getCategoryWithChildren(targetId);
      const childrenCards = (data.children ?? []).map(c => this.toCategoryCard(c));
      const entryCards = (data.entries ?? []).map(e => this.toEntryCard(e));
      return [...childrenCards, ...entryCards];
    }
  });

  readonly cards = computed<ResultCard[]>(() => this.cardsResource.value() ?? []);
  readonly loading = computed(() => this.cardsResource.isLoading());

  private readonly hitsResource = resource({
    params: () => {
      const q = this.filters.query().trim();
      return q.length >= 2 ? { q } : undefined;
    },
    loader: async ({ params }) => {
      const response = await firstValueFrom(
        this.http.get<{ results: SearchHit[] }>(`${environment.apiUrl}/search`, {
          params: { q: params.q }
        })
      );
      return response.results;
    }
  });

  readonly hits = computed<SearchHit[]>(() => this.hitsResource.value() ?? []);
  readonly hitsLoading = computed(() => this.hitsResource.isLoading());
  readonly hitsResolved = computed(() => this.hitsResource.status() === 'resolved');

  private toSectionCard(s: { value: SearchSection; label: string }): ResultCard {
    return { id: 0, title: s.label, imageUrl: '', kind: 'section', categoryId: 0, sectionKey: s.value };
  }

  private toCategoryCard(c: VaultCategory): ResultCard {
    return { id: c.id, title: c.title, imageUrl: '', kind: 'category', categoryId: c.id };
  }

  private toEntryCard(e: VaultEntry): ResultCard {
    return {
      id: e.id,
      title: e.title,
      imageUrl: e.thumbnailUrl || e.imageUrl,
      kind: 'entry',
      categoryId: e.categoryId
    };
  }
}
