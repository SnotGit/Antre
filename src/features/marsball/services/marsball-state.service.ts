import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MarsballDeleteService } from './marsball-delete.service';
import { BestiaireDeleteService } from '../bestiaire/services/bestiaire-delete.service';
import { RoverDeleteService } from '../rover/services/rover-delete.service';
import { CreateCategoryService } from '@shared/services/category/create-category.service';
import { NewMarsballItemService } from './new-marsball-item.service';
import { NewBestiaireCreatureService } from '../bestiaire/services/new-bestiaire-creature.service';
import { NewRoverItemService } from '../rover/services/new-rover-item.service';

@Injectable({
  providedIn: 'root'
})
export class MarsballStateService {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly marsballDeleteService = inject(MarsballDeleteService);
  private readonly bestiaireDeleteService = inject(BestiaireDeleteService);
  private readonly roverDeleteService = inject(RoverDeleteService);
  private readonly createCategoryService = inject(CreateCategoryService);
  private readonly newMarsballItemService = inject(NewMarsballItemService);
  private readonly newBestiaireCreatureService = inject(NewBestiaireCreatureService);
  private readonly newRoverItemService = inject(NewRoverItemService);

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

  //======= CONTEXT DETECTION =======

  private isInBestiaire(): boolean {
    return this.router.url.includes('/marsball/bestiaire');
  }

  private isInRover(): boolean {
    return this.router.url.includes('/marsball/rover');
  }

  //======= ACTIONS =======

  openCreateCategory(): void {
    this.createCategoryService.show();
  }

  openCreateItem(): void {
    if (this.isInBestiaire()) {
      this.newBestiaireCreatureService.show();
    } else if (this.isInRover()) {
      this.newRoverItemService.show();
    } else {
      this.newMarsballItemService.show();
    }
  }

  async deleteSelected(categories: Array<{ id: number; title: string }>): Promise<void> {
    const selectedIds = Array.from(this.selectedCategories());
    if (selectedIds.length === 0) return;

    if (this.isInBestiaire()) {
      const selectedNames = categories
        .filter(cat => selectedIds.includes(cat.id))
        .map(cat => cat.title);
      await this.bestiaireDeleteService.batchDeleteCategories(selectedIds, selectedNames);
    } else if (this.isInRover()) {
      await this.roverDeleteService.batchDeleteCategories(selectedIds);
    } else {
      const selectedNames = categories
        .filter(cat => selectedIds.includes(cat.id))
        .map(cat => cat.title);
      await this.marsballDeleteService.deleteCategories(selectedIds, selectedNames);
    }

    this.clearSelection();
  }
}