import { Service, inject, computed, resource } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { TerraformarsCrudService } from './terraformars-crud.service';
import { VaultCategory } from '../models/terraformars.models';
import { SearchOriginService } from '@shared/services/search-origin/search-origin.service';

export type BreadcrumbKind = 'universe' | 'category';

export interface BreadcrumbSegment {
  label: string;
  route: string | null;
  state?: { categoryId: number };
  queryParams?: Record<string, string>;
  isCurrent: boolean;
  kind: BreadcrumbKind;
}

@Service()
export class TerraformarsTreeService {

  //========== INJECTIONS ==========//

  private readonly router = inject(Router);
  private readonly crud = inject(TerraformarsCrudService);
  private readonly searchOrigin = inject(SearchOriginService);

  //========== SIGNALS ==========//

  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).url)
    ),
    { initialValue: this.router.url }
  );

  //========== DATA ==========//

  private readonly _resource = resource({
    loader: () => this.crud.getAllCategories()
  });

  readonly categories = computed(() => this._resource.value() ?? []);
  readonly loading = computed(() => this._resource.isLoading());

  reload(): void {
    this._resource.reload();
  }

  //========== COMPUTED ==========//

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
    const catId = this.currentCategoryId();
    const origin = this.searchOrigin.parse(this.currentUrl());
    const segments: BreadcrumbSegment[] = [];

    if (origin) {
      segments.push({
        label: 'Recherche',
        route: '/accueil/recherche',
        queryParams: { q: origin.q },
        isCurrent: catId === null,
        kind: 'universe'
      });
    } else {
      segments.push({
        label: 'Terraformars',
        route: '/terraformars',
        isCurrent: catId === null,
        kind: 'universe'
      });
    }

    if (catId !== null) {
      const path = this.buildPath(catId);
      for (let i = 0; i < path.length; i++) {
        const cat = path[i];
        segments.push({
          label: cat.title,
          route: `/terraformars/${this.slugify(cat.title)}`,
          state: { categoryId: cat.id },
          queryParams: origin ? { from: 'recherche', q: origin.q } : undefined,
          isCurrent: i === path.length - 1,
          kind: 'category'
        });
      }
    }

    return segments;
  });

  //========== HELPERS ==========//

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
    this.router.navigate([seg.route], {
      state: seg.state,
      queryParams: seg.queryParams
    });
  }

  slugify(title: string): string {
    return title.toLowerCase().replace(/\s+/g, '-');
  }
}
