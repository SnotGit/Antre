import { Component, inject, computed, resource } from '@angular/core';
import { Router } from '@angular/router';
import { TerraformarsCrudService } from '../../services/terraformars-crud.service';
import { TerraformarsTreeService } from '../../services/terraformars-tree.service';
import { TerraformarsSelectionService } from '../../services/terraformars-selection.service';
import { TerraformarsItemEditService } from '../../services/terraformars-item-edit.service';
import { CategoryWithChildren } from '../../models/terraformars.models';
import { AuthService } from '@shared/services/auth/auth.service';
import { CategoryDetail } from '../category-detail/category-detail';

@Component({
  selector: 'app-terraformars-category',
  imports: [CategoryDetail],
  templateUrl: './terraformars-category.html',
  styleUrl: './terraformars-category.scss'
})
export class TerraformarsCategory {

  //========== INJECTIONS ==========//

  private readonly router = inject(Router);
  private readonly crud = inject(TerraformarsCrudService);
  private readonly authService = inject(AuthService);
  protected readonly tree = inject(TerraformarsTreeService);
  protected readonly selection = inject(TerraformarsSelectionService);
  protected readonly itemEdit = inject(TerraformarsItemEditService);

  //========== SIGNALS ==========//

  isAdmin = this.authService.isAdmin;

  //========== COMPUTED ==========//

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
        this.router.navigate(['/terraformars']);
        return null;
      }
    }
  });

  categoryData = computed((): CategoryWithChildren | null => {
    if (this.categoryId() === 0) {
      const all = this.tree.categories();
      return {
        category: { id: 0, title: 'Terraformars', parentId: null, entryCount: 0, createdAt: '', updatedAt: '' },
        children: all.filter(c => c.parentId === null),
        entries: []
      };
    }
    return this.categoryResource.value() || null;
  });

  //========== NAVIGATION ==========//

  goToCategory(categoryId: number): void {
    const data = this.categoryData();
    if (!data) return;

    const category = data.children.find(c => c.id === categoryId);
    if (!category) return;

    this.router.navigate(['/terraformars', this.tree.slugify(category.title)], {
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
