import { Component, OnDestroy, inject, computed, resource, input, signal, effect, ViewChild, ElementRef } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { VaultGetService } from '@shared/vault/services/vault-get.service';
import { VaultDeleteService } from '@shared/vault/services/vault-delete.service';
import { VaultUpdateService } from '@shared/vault/services/vault-update.service';
import { VaultContextService } from '@shared/vault/services/vault-context.service';
import { CategoryWithChildren } from '@shared/vault/models/vault.models';
import { VaultEditEntryService } from '@shared/vault/services/vault-edit-entry.service';
import { VaultNewEntryService } from '@shared/vault/services/vault-new-entry.service';
import { CategoryStateService } from '@features/marsball/services/category-state.service';
import { ConsoleStateService } from '@features/menus/services/console-state.service';
import { CropService } from '@shared/services/crop-images/crop.service';
import { AuthService } from '@features/auth/services/auth.service';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-bestiaire-category',
  imports: [],
  templateUrl: './bestiaire-category.html',
  styleUrl: './bestiaire-category.scss'
})
export class BestiaireCategory implements OnDestroy {

  //======= INJECTIONS =======

  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly vaultGetService = inject(VaultGetService);
  private readonly vaultDeleteService = inject(VaultDeleteService);
  private readonly vaultUpdateService = inject(VaultUpdateService);
  private readonly vaultContext = inject(VaultContextService);
  private readonly editEntryService = inject(VaultEditEntryService);
  private readonly newEntryService = inject(VaultNewEntryService);
  private readonly categoryState = inject(CategoryStateService);
  private readonly consoleState = inject(ConsoleStateService);
  protected readonly cropService = inject(CropService);
  private readonly authService = inject(AuthService);
  private readonly API_URL = environment.apiUrl;

  //======= VIEW CHILDREN =======

  @ViewChild('imageContainer') imageContainer?: ElementRef<HTMLDivElement>;

  //======= ROUTER INPUTS =======

  titleUrl = input.required<string>();

  //======= ROUTER STATE =======

  private readonly routerState = history.state;
  private readonly routerStateCategoryId = this.routerState?.categoryId || 0;

  //======= SIGNALS =======

  openCreatureId = signal<number | null>(null);
  isAdmin = this.authService.isAdmin;

  //======= STATE SERVICE =======

  selectedItems = this.categoryState.selectedItems;
  selectedCategories = this.categoryState.selectedCategories;
  selection = this.categoryState.selectionItems;
  categorySelection = this.categoryState.selectionCategories;

  //======= CONSTRUCTOR =======

  constructor() {
    this.vaultContext.setContext('bestiaire');
  }

  //======= DATA LOADING =======

  private readonly categoryResource = resource({
    loader: async () => {
      if (!this.routerStateCategoryId) {
        this.router.navigate(['/marsball/bestiaire']);
        return null;
      }

      try {
        const data = await this.vaultGetService.getCategoryWithChildren(this.routerStateCategoryId);
        this.newEntryService.setCategoryId(data.category.id);
        return data;
      } catch {
        this.router.navigate(['/marsball/bestiaire']);
        return null;
      }
    }
  });

  categoryData = computed((): CategoryWithChildren | null => {
    return this.categoryResource.value() || null;
  });

  //======= EFFECTS =======

  private readonly _deleteRequestEffect = effect(() => {
    this.consoleState.deleteRequested();
    this.handleDeleteRequest();
  });

  private readonly _refreshEffect = effect(() => {
    this.newEntryService.refreshCounter();
    this.categoryResource.reload();
  });

  //======= DELETE HANDLER =======

  private async handleDeleteRequest(): Promise<void> {
    const data = this.categoryData();
    if (!data) return;

    if (this.categoryState.selectionItems()) {
      await this.categoryState.deleteSelectedItems(data.entries, this.vaultDeleteService);
    }
    if (this.categoryState.selectionCategories()) {
      await this.categoryState.deleteSelectedCategories(data.children, this.vaultDeleteService);
    }

    this.categoryResource.reload();
  }

  //======= LIFECYCLE =======

  ngOnDestroy(): void {
    this.categoryState.clearAllSelections();
  }

  //======= CREATURE ACTIONS =======

  toggleCreature(creatureId: number): void {
    if (this.selection()) return;
    this.openCreatureId.set(this.openCreatureId() === creatureId ? null : creatureId);
  }

  closeCreature(): void {
    this.openCreatureId.set(null);
  }

  isCreatureOpen(creatureId: number): boolean {
    return this.openCreatureId() === creatureId;
  }

  getImageUrl(imageUrl: string): string {
    return `${this.API_URL.replace('/api', '')}${imageUrl}`;
  }

  //======= SELECTION METHODS =======

  toggleSelection(creatureId: number): void {
    this.categoryState.toggleItemSelection(creatureId);
  }

  isSelected(creatureId: number): boolean {
    return this.categoryState.selectedItems().has(creatureId);
  }

  toggleCategorySelection(categoryId: number): void {
    this.categoryState.toggleCategorySelection(categoryId);
  }

  isSelectedCategory(categoryId: number): boolean {
    return this.categoryState.selectedCategories().has(categoryId);
  }

  //======= ADMIN ACTIONS =======

  editCreature(creatureId: number): void {
    const creature = this.categoryData()?.entries.find(c => c.id === creatureId);
    if (!creature) return;

    this.editEntryService.startEdit(
      creature.id,
      creature.title,
      creature.description || '',
      this.getImageUrl(creature.imageUrl)
    );
  }

  async deleteCreature(creatureId: number): Promise<void> {
    const creature = this.categoryData()?.entries.find(c => c.id === creatureId);
    if (!creature) return;

    await this.vaultDeleteService.deleteEntry(creatureId, creature.title);
    this.categoryResource.reload();
  }

  //======= NAVIGATION =======

  goToCategory(categoryId: number, categoryTitle: string): void {
    if (this.categorySelection()) return;

    this.router.navigate(['/marsball/bestiaire', categoryTitle.toLowerCase().replace(/\s+/g, '-')], {
      state: {
        categoryId: categoryId,
        categoryTitle: categoryTitle
      }
    });
  }

  goBack(): void {
    const data = this.categoryData();
    if (data?.category.parentId) {
      this.location.back();
    } else {
      this.router.navigate(['/marsball/bestiaire']);
    }
  }
}
