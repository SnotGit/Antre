import { Injectable, inject, signal, computed } from '@angular/core';
import { MarsballDeleteService } from './marsball-delete.service';

@Injectable({
  providedIn: 'root'
})
export class MarsballCategoryStateService {

  //======= INJECTIONS =======

  private readonly marsballDeleteService = inject(MarsballDeleteService);

  //======= SIGNALS =======

  selectedItems = signal<Set<number>>(new Set());
  selectedCategories = signal<Set<number>>(new Set());

  //======= COMPUTED =======

  selectionItems = computed(() => this.selectedItems().size > 0);
  selectionCategories = computed(() => this.selectedCategories().size > 0);
  hasSelection = computed(() => this.selectionItems() || this.selectionCategories());

  //======= SELECTION =======

  toggleItemSelection(itemId: number): void {
    const newSelection = new Set(this.selectedItems());
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    this.selectedItems.set(newSelection);
  }

  toggleCategorySelection(categoryId: number): void {
    const newSelection = new Set(this.selectedCategories());
    if (newSelection.has(categoryId)) {
      newSelection.delete(categoryId);
    } else {
      newSelection.add(categoryId);
    }
    this.selectedCategories.set(newSelection);
  }

  clearAllSelections(): void {
    this.selectedItems.set(new Set());
    this.selectedCategories.set(new Set());
  }

  //======= ACTIONS =======

  async deleteSelectedItems(items: Array<{ id: number; title: string }>): Promise<void> {
    const selectedIds = Array.from(this.selectedItems());
    if (selectedIds.length === 0) return;

    const selectedNames = items
      .filter(item => selectedIds.includes(item.id))
      .map(item => item.title);

    await this.marsballDeleteService.deleteItems(selectedIds, selectedNames);
    this.selectedItems.set(new Set());
  }

  async deleteSelectedCategories(categories: Array<{ id: number; title: string }>): Promise<void> {
    const selectedIds = Array.from(this.selectedCategories());
    if (selectedIds.length === 0) return;

    const selectedNames = categories
      .filter(cat => selectedIds.includes(cat.id))
      .map(cat => cat.title);

    await this.marsballDeleteService.deleteCategories(selectedIds, selectedNames);
    this.selectedCategories.set(new Set());
  }
}