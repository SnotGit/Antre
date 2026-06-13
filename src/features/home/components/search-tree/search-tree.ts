import { Component, inject, signal, computed, effect, untracked } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ElenaSearchService, SearchResultItem } from '../../services/elena-search.service';

//========== TYPES ==========//

const SECTION_ORDER = ['marsball', 'bestiaire', 'rover', 'terraformars'] as const;

const SECTION_LABELS: Record<string, string> = {
  marsball: 'Marsball',
  bestiaire: 'Bestiaire',
  rover: 'Rover',
  terraformars: 'Terraformars'
};

interface SectionRow {
  kind: 'section';
  section: string;
  label: string;
}

interface CategoryRow {
  kind: 'category';
  section: string;
  id: number;
  title: string;
  route: string;
  count: number;
  hasItems: boolean;
  guide: string;
}

interface ItemRow {
  kind: 'item';
  section: string;
  id: number;
  title: string;
  route: string;
  guide: string;
}

type TreeRow = SectionRow | CategoryRow | ItemRow;

interface CategoryBucket {
  id: number;
  title: string;
  route: string;
  itemCount: number;
  matchedAsCategory: boolean;
  items: SearchResultItem[];
}

//========== COMPONENT ==========//

@Component({
  selector: 'app-search-tree',
  imports: [RouterLink],
  templateUrl: './search-tree.html',
  styleUrl: './search-tree.scss'
})
export class SearchTree {

  //========== INJECTIONS ==========//

  private readonly route = inject(ActivatedRoute);
  protected readonly search = inject(ElenaSearchService);

  //========== SIGNALS ==========//

  private readonly routeQuery = toSignal(
    this.route.queryParamMap.pipe(map(p => p.get('q') ?? '')),
    { initialValue: '' }
  );

  protected readonly collapsedSections = signal<Set<string>>(new Set());
  protected readonly collapsedCategories = signal<Set<string>>(new Set());

  //========== EFFECTS ==========//

  private readonly _syncQuery = effect(() => {
    const q = this.routeQuery();
    untracked(() => this.search.query.set(q));
  });

  //========== COMPUTED ==========//

  protected readonly rows = computed<TreeRow[]>(() => {
    const groups = this.search.groups();
    const collapsedSections = this.collapsedSections();
    const collapsedCategories = this.collapsedCategories();
    const out: TreeRow[] = [];

    for (const section of SECTION_ORDER) {
      const group = groups.find(g => g.section === section);
      if (!group || (group.categories.length === 0 && group.items.length === 0)) continue;

      const buckets = new Map<number, CategoryBucket>();
      for (const cat of group.categories) {
        buckets.set(cat.id, { id: cat.id, title: cat.title, route: cat.route, itemCount: cat.itemCount, matchedAsCategory: true, items: [] });
      }
      for (const item of group.items) {
        let bucket = buckets.get(item.categoryId);
        if (!bucket) {
          bucket = { id: item.categoryId, title: item.category, route: item.route, itemCount: 0, matchedAsCategory: false, items: [] };
          buckets.set(item.categoryId, bucket);
        }
        bucket.items.push(item);
      }

      out.push({ kind: 'section', section, label: SECTION_LABELS[section] });
      if (collapsedSections.has(section)) continue;

      for (const bucket of buckets.values()) {
        const hasItems = bucket.items.length > 0;
        out.push({
          kind: 'category',
          section,
          id: bucket.id,
          title: bucket.title,
          route: bucket.route || (hasItems ? bucket.items[0].route : ''),
          count: bucket.matchedAsCategory ? bucket.itemCount : bucket.items.length,
          hasItems,
          guide: ''
        });

        if (hasItems && !collapsedCategories.has(this.categoryKey(section, bucket.id))) {
          for (const item of bucket.items) {
            out.push({ kind: 'item', section, id: item.id, title: item.title, route: item.route, guide: '└─' });
          }
        }
      }
    }

    return out;
  });

  //========== TREE ==========//

  private categoryKey(section: string, id: number): string {
    return `${section}:${id}`;
  }

  protected trackRow(index: number, row: TreeRow): string {
    if (row.kind === 'section') return 'section-' + row.section;
    return row.kind + '-' + row.section + '-' + row.id;
  }

  protected isSectionCollapsed(section: string): boolean {
    return this.collapsedSections().has(section);
  }

  protected isCategoryCollapsed(section: string, id: number): boolean {
    return this.collapsedCategories().has(this.categoryKey(section, id));
  }

  protected toggleSection(section: string): void {
    const set = new Set(this.collapsedSections());
    set.has(section) ? set.delete(section) : set.add(section);
    this.collapsedSections.set(set);
  }

  protected toggleCategory(section: string, id: number): void {
    const set = new Set(this.collapsedCategories());
    const key = this.categoryKey(section, id);
    set.has(key) ? set.delete(key) : set.add(key);
    this.collapsedCategories.set(set);
  }
}
