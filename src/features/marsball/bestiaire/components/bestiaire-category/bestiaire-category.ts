import { Component, OnDestroy, inject, computed, resource, input, signal, ViewChild, ElementRef } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { BestiaireGetService } from '../../services/bestiaire-get.service';
import { BestiaireDeleteService } from '../../services/bestiaire-delete.service';
import { NewBestiaireCreatureService } from '../../services/new-bestiaire-creature.service';
import { EditBestiaireCreatureService } from '../../services/edit-bestiaire-creature.service';
import { CategoryWithCreatures } from '../../models/bestiaire.models';
import { CropService } from '@shared/services/crop-images/crop.service';
import { TitleResolver } from '@shared/services/resolvers/title-resolver.service';
import { TypingEffectService } from '@shared/services/typing-effect/typing-effect.service';
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
  private readonly newBestiaireCreatureService = inject(NewBestiaireCreatureService);
  private readonly editBestiaireCreatureService = inject(EditBestiaireCreatureService);
  protected readonly cropService = inject(CropService);
  private readonly titleResolver = inject(TitleResolver);
  private readonly typingService = inject(TypingEffectService);
  private readonly authService = inject(AuthService);
  private readonly API_URL = environment.apiUrl;

  //======= VIEW CHILDREN =======

  @ViewChild('imageContainer') imageContainer?: ElementRef<HTMLDivElement>;

  //======= TYPING EFFECT =======

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //======= ROUTER INPUTS =======

  titleUrl = input.required<string>();

  //======= ROUTER STATE =======

  private readonly routerState = history.state;
  private readonly routerStateCategoryId = this.routerState?.categoryId || 0;

  //======= SIGNALS =======

  openCreatureId = signal<number | null>(null);
  selectedCreatures = signal<Set<number>>(new Set());
  selectedCategories = signal<Set<number>>(new Set());
  isAdmin = this.authService.isAdmin;

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

  //======= COMPUTED =======

  selection = computed(() => this.selectedCreatures().size > 0);
  categorySelection = computed(() => this.selectedCategories().size > 0);

  currentTitle = computed(() => {
    const data = this.categoryData();
    return data?.category.title || 'Bestiaire';
  });



  //======= LIFECYCLE =======

  ngOnDestroy(): void {
    this.typingService.destroy();
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

  //======= CREATURE SELECTION METHODS =======

  toggleSelection(creatureId: number): void {
    const newSelection = new Set(this.selectedCreatures());
    if (newSelection.has(creatureId)) {
      newSelection.delete(creatureId);
    } else {
      newSelection.add(creatureId);
    }
    this.selectedCreatures.set(newSelection);
  }

  isSelected(creatureId: number): boolean {
    return this.selectedCreatures().has(creatureId);
  }

  //======= CATEGORY SELECTION METHODS =======

  toggleCategorySelection(categoryId: number): void {
    const newSelection = new Set(this.selectedCategories());
    if (newSelection.has(categoryId)) {
      newSelection.delete(categoryId);
    } else {
      newSelection.add(categoryId);
    }
    this.selectedCategories.set(newSelection);
  }

  isSelectedCategory(categoryId: number): boolean {
    return this.selectedCategories().has(categoryId);
  }

  //======= ADMIN ACTIONS =======

  async deleteSelected(): Promise<void> {
    const selectedIds = Array.from(this.selectedCreatures());
    if (selectedIds.length === 0) return;

    const titles = this.categoryData()?.creatures
      .filter(c => selectedIds.includes(c.id))
      .map(c => c.title) || [];

    await this.bestiaireDeleteService.batchDeleteCreatures(selectedIds, titles);
    this.selectedCreatures.set(new Set());
    this.categoryResource.reload();
  }

  async deleteSelectedCategories(): Promise<void> {
    const selectedIds = Array.from(this.selectedCategories());
    if (selectedIds.length === 0) return;

    const titles = this.categoryData()?.children
      .filter(c => selectedIds.includes(c.id))
      .map(c => c.title) || [];

    await this.bestiaireDeleteService.batchDeleteCategories(selectedIds, titles);
    this.selectedCategories.set(new Set());
    this.categoryResource.reload();
  }

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
    
    const titleUrl = this.titleResolver.encodeTitle(categoryTitle);
    this.router.navigate(['/marsball/bestiaire', titleUrl], {
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