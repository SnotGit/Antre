import { Injectable, signal, linkedSignal, computed } from '@angular/core';

export type Universe = 'marsball' | 'terraformars' | 'archives' | 'chroniques';
export type SearchSection = 'marsball' | 'bestiaire' | 'rover';

@Injectable({ providedIn: 'root' })
export class SearchFiltersService {

  readonly query = signal<string>('');

  readonly universe = signal<Universe | ''>('');

  readonly section = linkedSignal<Universe | '', SearchSection | ''>({
    source: this.universe,
    computation: () => ''
  });

  readonly categoryId = linkedSignal<SearchSection | '', number | ''>({
    source: this.section,
    computation: () => ''
  });

  readonly subCategoryId = linkedSignal<number | '', number | ''>({
    source: this.categoryId,
    computation: () => ''
  });

  readonly type = signal<string>('');
  readonly rarity = signal<string>('');

  readonly isActive = computed(() => this.section() !== '');

  reset(): void {
    this.section.set('');
    this.type.set('');
    this.rarity.set('');
  }

  clearQuery(): void {
    this.query.set('');
  }

  clearAll(): void {
    this.universe.set('');
    this.type.set('');
    this.rarity.set('');
    this.query.set('');
  }
}
