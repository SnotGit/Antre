import { Component, OnDestroy, inject, computed, resource, input, signal, effect, ViewChild, ElementRef } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { BestiaireGetService } from '../../services/bestiaire-get.service';
import { BestiaireDeleteService } from '../../services/bestiaire-delete.service';
import { BestiaireUpdateService } from '../../services/bestiaire-update.service';
import { NewBestiaireCreatureService } from '../../services/new-bestiaire-creature.service';
import { EditBestiaireCreatureService } from '../../services/edit-bestiaire-creature.service';
import { CategoryStateService } from '@features/marsball/services/category-state.service';
import { ConsoleStateService } from '@features/menus/services/console-state.service';
import { CategoryWithCreatures } from '../../models/bestiaire.models';
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
  private readonly bestiaireGetService = inject(BestiaireGetService);
  private readonly bestiaireDeleteService = inject(BestiaireDeleteService);
  private readonly bestiaireUpdateService = inject(BestiaireUpdateService);
  private readonly newBestiaireCreatureService = inject(NewBestiaireCreatureService);
  private readonly editBestiaireCreatureService = inject(EditBestiaireCreatureService);
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

  //======= DATA LOADING =======

  private readonly categoryResource = resource({
    loader: async () => {
      if (!this.routerStateCategoryId) {
        this.router.navigate(['/marsball/bestiaire']);
        return null;
      }

      try {
        const data = await this.bestiaireGetService.getCategoryWithCreatures(this.routerStateCategoryId);
        this.newBestiaireCreatureService.setCategoryId(data.category.id);
        return data;
      } catch {
        this.router.navigate(['/marsball/bestiaire']);
        return null;
      }
    }
  });

  categoryData = computed((): CategoryWithCreatures | null => {
    return this.categoryResource.value() || null;
  });

  //======= EFFECTS =======

  private readonly _deleteRequestEffect = effect(() => {
    this.consoleState.deleteRequested();
    this.handleDeleteRequest();
  });

  //======= DELETE HANDLER =======

  private async handleDeleteRequest(): Promise<void> {
    const data = this.categoryData();
    if (!data) return;

    if (this.categoryState.selectionItems()) {
      await this.categoryState.deleteSelectedItems(data.creatures, this.bestiaireDeleteService);
    }
    if (this.categoryState.selectionCategories()) {
      await this.categoryState.deleteSelectedCategories(data.children, this.bestiaireDeleteService);
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
    const creature = this.categoryData()?.creatures.find(c => c.id === creatureId);
    if (!creature) return;

    this.editBestiaireCreatureService.startEdit(
      creature.id,
      creature.title,
      creature.description,
      this.getImageUrl(creature.imageUrl)
    );
  }

  async deleteCreature(creatureId: number): Promise<void> {
    const creature = this.categoryData()?.creatures.find(c => c.id === creatureId);
    if (!creature) return;

    await this.bestiaireDeleteService.deleteCreature(creatureId, creature.title);
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