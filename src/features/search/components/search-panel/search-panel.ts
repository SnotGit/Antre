import { Component, inject, computed } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { VaultCategoriesService } from '@shared/vault/services/vault-categories.service';
import { SearchFiltersService, Universe, SearchSection } from '@features/search/services/search-filters.service';
import { SECTIONS_BY_UNIVERSE } from '@features/search/services/search-config';

const UNIVERSES: Array<{ value: Universe; label: string }> = [
  { value: 'archives', label: 'Archives' },
  { value: 'marsball', label: 'Marsball' },
  { value: 'terraformars', label: 'Terraformars' },
  { value: 'chroniques', label: 'Chroniques' }
];

const TAB_ROUTES = ['/marsball', '/terraformars', '/archives', '/chroniques'];

@Component({
  selector: 'app-search-panel',
  imports: [],
  templateUrl: './search-panel.html',
  styleUrl: './search-panel.scss'
})
export class SearchPanel {

  private readonly router = inject(Router);
  private readonly vaultCategories = inject(VaultCategoriesService);
  protected readonly filters = inject(SearchFiltersService);

  readonly universes = UNIVERSES;

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).url)
    ),
    { initialValue: this.router.url }
  );

  readonly showUniverseFilter = computed(() => {
    const url = this.currentUrl();
    return !TAB_ROUTES.some(tab => url.startsWith(tab));
  });

  readonly availableSections = computed(() => {
    const universe = this.filters.universe();
    return universe ? SECTIONS_BY_UNIVERSE[universe] : [];
  });

  readonly rootCategories = computed(() =>
    this.vaultCategories.categories().filter(c => c.parentId === null)
  );

  readonly subCategories = computed(() => {
    const parentId = this.filters.categoryId();
    if (parentId === '') return [];
    return this.vaultCategories.categories().filter(c => c.parentId === parentId);
  });

  readonly showItemFilters = computed(() => {
    const section = this.filters.section();
    if (section === 'bestiaire') return false;

    const cat = this.filters.categoryId();
    const sub = this.filters.subCategoryId();
    if (sub) return true;
    if (cat && this.subCategories().length === 0) return true;
    return false;
  });

  setQuery(value: string): void {
    this.filters.query.set(value);
  }

  setUniverse(value: string): void {
    this.filters.universe.set((value as Universe) || '');
  }

  setSection(value: string): void {
    const section = (value as SearchSection) || '';
    this.filters.section.set(section);

    if (this.isOnTab() && section) {
      this.router.navigate([this.getSectionRoute(section)]);
    }
  }

  setCategory(value: string): void {
    const id = value === '' ? '' : +value;
    this.filters.categoryId.set(id);

    if (this.isOnTab() && id !== '') {
      this.navigateToCategory(id);
    }
  }

  setSubCategory(value: string): void {
    const id = value === '' ? '' : +value;
    this.filters.subCategoryId.set(id);

    if (this.isOnTab() && id !== '') {
      this.navigateToCategory(id);
    }
  }

  private navigateToCategory(id: number): void {
    const cat = this.vaultCategories.categories().find(c => c.id === id);
    if (!cat) return;
    const slug = cat.title.toLowerCase().replace(/\s+/g, '-');
    const base = this.getSectionRoute(this.filters.section() || 'marsball');
    this.router.navigate([base, slug], { state: { categoryId: id } });
  }

  private getSectionRoute(section: SearchSection): string {
    switch (section) {
      case 'bestiaire': return '/marsball/bestiaire';
      case 'rover': return '/marsball/rover';
      default: return '/marsball';
    }
  }

  private isOnTab(): boolean {
    return TAB_ROUTES.some(tab => this.currentUrl().startsWith(tab));
  }
}
