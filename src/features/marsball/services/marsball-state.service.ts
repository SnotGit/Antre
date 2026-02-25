import { Injectable, inject, signal, computed } from '@angular/core';
import { VaultDeleteService } from '@shared/vault/services/vault-delete.service';
import { VaultNewEntryService } from '@shared/vault/services/vault-new-entry.service';
import { CreateCategoryService } from '@shared/services/category/create-category.service';

@Injectable({
  providedIn: 'root'
})
export class MarsballStateService {

  //======= INJECTIONS =======

  private readonly vaultDeleteService = inject(VaultDeleteService);
  private readonly createCategoryService = inject(CreateCategoryService);
  private readonly newEntryService = inject(VaultNewEntryService);

  //======= SIGNALS =======

  selectedCategories = signal<Set<number>>(new Set());

  //======= COMPUTED =======

  selection = computed(() => this.selectedCategories().size > 0);

  //======= SELECTION =======

  toggleSelection(categoryId: number): void {
    const newSelection = new Set(this.selectedCategories());
    if (newSelection.has(categoryId)) {
      newSelection.delete(categoryId);
    } else {
      newSelection.add(categoryId);
    }
    this.selectedCategories.set(newSelection);
  }

  clearSelection(): void {
    this.selectedCategories.set(new Set());
  }

  //======= ACTIONS =======

  openCreateCategory(): void {
    this.createCategoryService.show();
  }

  openCreateItem(): void {
    this.newEntryService.show();
  }

  async deleteSelected(categories: Array<{ id: number; title: string }>): Promise<void> {
    const selectedIds = Array.from(this.selectedCategories());
    if (selectedIds.length === 0) return;

    const selectedNames = categories
      .filter(cat => selectedIds.includes(cat.id))
      .map(cat => cat.title);

    await this.vaultDeleteService.deleteCategories(selectedIds, selectedNames);

    this.clearSelection();
  }
}
