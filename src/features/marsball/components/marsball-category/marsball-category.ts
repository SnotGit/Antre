import { Component, inject, computed, resource } from '@angular/core';
import { Router } from '@angular/router';
import { MarsballCrudService } from '../../services/marsball-crud.service';
import { MarsballTreeService } from '../../services/marsball-tree.service';
import { MarsballSelectionService } from '../../services/marsball-selection.service';
import { ItemEditService } from '../../services/item-edit.service';
import { CategoryWithChildren } from '../../models/marsball.models';
import { AuthService } from '@features/auth/services/auth.service';
import { CategoryDetail } from '../category-detail/category-detail';

const SECTION_ROUTES: Record<string, string> = {
  marsball: '/marsball',
  bestiaire: '/marsball/bestiaire',
  rover: '/marsball/rover'
};

@Component({
  selector: 'app-marsball-category',
  imports: [CategoryDetail],
  templateUrl: './marsball-category.html',
  styleUrl: './marsball-category.scss'
})
export class MarsballCategory {

  //========== INJECTIONS ==========//

  private readonly router = inject(Router);
  private readonly crud = inject(MarsballCrudService);
  private readonly authService = inject(AuthService);
  protected readonly tree = inject(MarsballTreeService);
  protected readonly selection = inject(MarsballSelectionService);
  protected readonly itemEdit = inject(ItemEditService);

  //========== SIGNALS ==========//

  isAdmin = this.authService.isAdmin;

  //========== COMPUTED ==========//

  private readonly section = computed(() => this.tree.activeSection());
  private readonly sectionRoute = computed(() => SECTION_ROUTES[this.section()] ?? '/marsball');
  protected readonly sectionLabel = computed(() => this.section().toUpperCase());

  private readonly categoryId = computed<number>(() => {
    this.tree.currentUrl();
    const fromState = history.state?.categoryId;
    if (fromState) return fromState;
    return this.tree.currentCategoryId() ?? 0;
  });

  //========== DATA LOADING ==========//

  private readonly categoryResource = resource({
    params: () => {
      const id = this.categoryId();
      if (!id) return undefined;
      return { id, tick: this.tree.categories() };
    },
    loader: async ({ params }) => {
      try {
        return await this.crud.getCategoryWithChildren(params.id);
      } catch {
        this.router.navigate([this.sectionRoute()]);
        return null;
      }
    }
  });

  categoryData = computed((): CategoryWithChildren | null => {
    return this.categoryResource.value() || null;
  });

  //========== NAVIGATION ==========//

  goToCategory(categoryId: number): void {
    const data = this.categoryData();
    if (!data) return;

    const category = data.children.find(c => c.id === categoryId);
    if (!category) return;

    this.router.navigate([this.sectionRoute(), this.tree.slugify(category.title)], {
      state: { categoryId: category.id }
    });
  }

  //========== SÉLECTION ==========//

  toggleCategorySelection(category: { id: number; title: string }): void {
    this.selection.toggleCategory(category.id, category.title);
  }

  isSelectedCategory(categoryId: number): boolean {
    return this.selection.selectedCategories().has(categoryId);
  }

  //========== ITEMS ==========//

  onEntriesChanged(): void {
    this.tree.reload();
  }
}
