import { Injectable, signal, computed } from '@angular/core';
import { VaultDeleteService } from '@shared/vault/services/vault-delete.service';

@Injectable({
  providedIn: 'root'
})
export class CategoryStateService {

  //======= SIGNALS =======

  private selectedItemsSignal = signal<Set<number>>(new Set());
  private selectedCategoriesSignal = signal<Set<number>>(new Set());

  //======= PUBLIC SIGNALS =======

  selectedItems = this.selectedItemsSignal.asReadonly();
  selectedCategories = this.selectedCategoriesSignal.asReadonly();

  //======= COMPUTED =======

  selectionItems = computed(() => this.selectedItemsSignal().size > 0);
  selectionCategories = computed(() => this.selectedCategoriesSignal().size > 0);
  hasSelection = computed(() => this.selectionItems() || this.selectionCategories());

  //======= ITEM SELECTION =======

  toggleItemSelection(itemId: number): void {
    const current = new Set(this.selectedItemsSignal());
    if (current.has(itemId)) {
      current.delete(itemId);
    } else {
      current.add(itemId);
    }
    this.selectedItemsSignal.set(current);
  }

  //======= CATEGORY SELECTION =======

  toggleCategorySelection(categoryId: number): void {
    const current = new Set(this.selectedCategoriesSignal());
    if (current.has(categoryId)) {
      current.delete(categoryId);
    } else {
      current.add(categoryId);
    }
    this.selectedCategoriesSignal.set(current);
  }

  //======= CLEAR SELECTIONS =======

  clearAllSelections(): void {
    this.selectedItemsSignal.set(new Set());
    this.selectedCategoriesSignal.set(new Set());
  }

  //======= DELETE ENTRIES =======

  async deleteSelectedItems(
    entries: Array<{ id: number; title: string }>,
    deleteService: VaultDeleteService
  ): Promise<void> {
    const selectedIds = Array.from(this.selectedItemsSignal());
    if (selectedIds.length === 0) return;

    const titles = entries
      .filter(entry => selectedIds.includes(entry.id))
      .map(entry => entry.title);

    await deleteService.deleteEntries(selectedIds, titles);

    this.selectedItemsSignal.set(new Set());
  }

  //======= DELETE CATEGORIES =======

  async deleteSelectedCategories(
    categories: Array<{ id: number; title: string }>,
    deleteService: VaultDeleteService
  ): Promise<void> {
    const selectedIds = Array.from(this.selectedCategoriesSignal());
    if (selectedIds.length === 0) return;

    const titles = categories
      .filter(cat => selectedIds.includes(cat.id))
      .map(cat => cat.title);

    await deleteService.deleteCategories(selectedIds, titles);

    this.selectedCategoriesSignal.set(new Set());
  }
}
