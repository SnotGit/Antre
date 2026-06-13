import { Service, inject, computed, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

//========== TYPES ==========//

export type DepositSection = 'marsball' | 'bestiaire' | 'rover' | 'terraformars';

export interface RawCategory {
  id: number;
  title: string;
  parentId: number | null;
  entryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TreeNode {
  id: number;
  title: string;
  entryCount: number;
  children: TreeNode[];
  section: DepositSection;
}

export interface SectionTree {
  key: DepositSection;
  label: string;
  roots: TreeNode[];
}

interface CategoriesResponse {
  categories: RawCategory[];
}

const SECTION_LABELS: Record<DepositSection, string> = {
  marsball: 'Marsball',
  bestiaire: 'Bestiaire',
  rover: 'Rover',
  terraformars: 'Terraformars'
};

const SECTIONS: DepositSection[] = ['marsball', 'bestiaire', 'rover', 'terraformars'];

//========== HELPERS ==========//

function buildTree(flat: RawCategory[], section: DepositSection): TreeNode[] {
  const sorted = [...flat].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const nodeMap = new Map<number, TreeNode>();
  for (const cat of sorted) {
    nodeMap.set(cat.id, { id: cat.id, title: cat.title, entryCount: cat.entryCount, children: [], section });
  }

  const roots: TreeNode[] = [];
  for (const cat of sorted) {
    const node = nodeMap.get(cat.id)!;
    if (cat.parentId === null) {
      roots.push(node);
    } else {
      nodeMap.get(cat.parentId)?.children.push(node);
    }
  }
  return roots;
}

//========== SERVICE ==========//

@Service()
export class DepositTreeService {

  //========== INJECTIONS ==========//

  private readonly http = inject(HttpClient);

  //========== RESOURCE ==========//

  private readonly _resource = resource({
    loader: async () => {
      const results = await Promise.all(
        SECTIONS.map(section =>
          firstValueFrom(
            this.http.get<CategoriesResponse>(`${environment.apiUrl}/${section}/categories/all`)
          ).then(r => ({ section, categories: r.categories }))
        )
      );
      return results;
    }
  });

  //========== COMPUTED ==========//

  readonly loading = computed(() => this._resource.isLoading());
  readonly error = computed(() => this._resource.error());

  readonly sections = computed<SectionTree[]>(() => {
    const data = this._resource.value();
    if (!data) return [];
    return data.map(({ section, categories }) => ({
      key: section,
      label: SECTION_LABELS[section],
      roots: buildTree(categories, section)
    }));
  });

  //========== ACTIONS ==========//

  reload(): void {
    this._resource.reload();
  }
}
