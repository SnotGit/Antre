import { Service, inject, computed, resource } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { MarsballCrudService } from './marsball-crud.service';
import { VaultCategory } from '../models/marsball.models';
import { SearchFiltersService, Universe, SearchSection } from '@features/search/services/search-filters.service';

export type BreadcrumbKind = 'universe' | 'section' | 'category';

export interface BreadcrumbSegment {
  label: string;
  route: string | null;
  state?: { categoryId: number };
  isCurrent: boolean;
  kind: BreadcrumbKind;
}

const SECTION_ROUTES: Record<SearchSection, string> = {
  marsball: '/marsball',
  bestiaire: '/marsball/bestiaire',
  rover: '/marsball/rover'
};

const SECTION_LABELS: Record<SearchSection, string> = {
  marsball: 'Marsball',
  bestiaire: 'Bestiaire',
  rover: 'Rover'
};

@Service()
export class MarsballTreeService {

  private readonly router = inject(Router);
  private readonly crud = inject(MarsballCrudService);
  private readonly filters = inject(SearchFiltersService);

  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).url)
    ),
    { initialValue: this.router.url }
  );

  private readonly isHome = computed(() => this.currentUrl().startsWith('/accueil'));

  private readonly urlUniverse = computed<Universe | ''>(() => {
    const url = this.currentUrl();
    if (url.startsWith('/marsball')) return 'marsball';
    if (url.startsWith('/terraformars')) return 'terraformars';
    if (url.startsWith('/archives')) return 'archives';
    if (url.startsWith('/chroniques')) return 'chroniques';
    return '';
  });

  private readonly urlSection = computed<SearchSection | ''>(() => {
    const url = this.currentUrl();
    if (url.startsWith('/marsball/bestiaire')) return 'bestiaire';
    if (url.startsWith('/marsball/rover')) return 'rover';
    if (url.startsWith('/marsball')) return 'marsball';
    return '';
  });

  readonly activeSection = computed<SearchSection | ''>(() =>
    this.isHome() ? this.filters.section() : this.urlSection()
  );

  private readonly _resource = resource({
    params: () => this.activeSection() || undefined,
    loader: ({ params }) => this.crud.getAllCategories(params as SearchSection)
  });

  readonly categories = computed(() => this._resource.value() ?? []);
  readonly loading = computed(() => this._resource.isLoading());

  reload(): void {
    this._resource.reload();
  }

  readonly currentCategoryId = computed<number | null>(() => {
    const url = this.currentUrl();
    const cleanUrl = url.split('?')[0].split('#')[0];
    const segments = cleanUrl.split('/').filter(Boolean);
    if (segments.length < 2) return null;
    const lastSlug = decodeURIComponent(segments[segments.length - 1]);
    const cats = this.categories();
    const match = cats.find(c => this.slugify(c.title) === lastSlug);
    return match?.id ?? null;
  });

  readonly breadcrumb = computed<BreadcrumbSegment[]>(() => {
    const home = this.isHome();
    const universe = home ? this.filters.universe() : this.urlUniverse();
    const section = home ? this.filters.section() : this.urlSection();
    const catId = home
      ? (this.filters.subCategoryId() || this.filters.categoryId() || null)
      : this.currentCategoryId();

    const segments: BreadcrumbSegment[] = [];

    if (universe) {
      segments.push({
        label: this.capitalize(universe),
        route: '/' + universe,
        isCurrent: (!section || section === universe) && !catId,
        kind: 'universe'
      });
    }

    if (section && section !== universe) {
      segments.push({
        label: SECTION_LABELS[section],
        route: SECTION_ROUTES[section],
        isCurrent: !catId,
        kind: 'section'
      });
    }

    if (catId && typeof catId === 'number') {
      const path = this.buildPath(catId);
      const base = section ? SECTION_ROUTES[section] : '/marsball';
      for (let i = 0; i < path.length; i++) {
        const cat = path[i];
        segments.push({
          label: cat.title,
          route: `${base}/${this.slugify(cat.title)}`,
          state: { categoryId: cat.id },
          isCurrent: i === path.length - 1,
          kind: 'category'
        });
      }
    }

    return segments;
  });

  buildPath(catId: number): VaultCategory[] {
    const all = this.categories();
    const path: VaultCategory[] = [];
    let current = all.find(c => c.id === catId);
    while (current) {
      path.unshift(current);
      const parentId = current.parentId;
      current = parentId !== null ? all.find(c => c.id === parentId) : undefined;
    }
    return path;
  }

  navigateSegment(seg: BreadcrumbSegment): void {
    if (!seg.route || seg.isCurrent) return;
    if (seg.state) {
      this.router.navigate([seg.route], { state: seg.state });
    } else {
      this.router.navigate([seg.route]);
    }
  }

  slugify(title: string): string {
    return title.toLowerCase().replace(/\s+/g, '-');
  }

  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
