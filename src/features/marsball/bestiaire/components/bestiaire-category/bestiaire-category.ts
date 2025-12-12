import { Component, OnDestroy, inject, computed, resource, input, signal, effect, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { BestiaireGetService } from '../../services/bestiaire-get.service';
import { BestiaireDeleteService } from '../../services/bestiaire-delete.service';
import { BestiaireUpdateService } from '../../services/bestiaire-update.service';
import { CategoryWithCreatures, Creature } from '../../models/bestiaire.models';
import { CropService } from '@shared/services/crop-images/crop.service';
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

  private readonly router = inject(Router);
  private readonly bestiaireGetService = inject(BestiaireGetService);
  private readonly bestiaireDeleteService = inject(BestiaireDeleteService);
  private readonly bestiaireUpdateService = inject(BestiaireUpdateService);
  protected readonly cropService = inject(CropService);
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

  categoryId = input.required<string>();

  //======= SIGNALS =======

  openCreatureId = signal<number | null>(null);
  selectedCreatures = signal<Set<number>>(new Set());
  selectedCategories = signal<Set<number>>(new Set());
  isAdmin = this.authService.isAdmin;

  //======= DATA LOADING =======

  private readonly categoryResource = resource({
    params: () => ({ categoryId: parseInt(this.categoryId(), 10) }),
    loader: async ({ params }) => {
      if (isNaN(params.categoryId)) {
        this.router.navigate(['/marsball/bestiaire']);
        return null;
      }
      
      try {
        return await this.bestiaireGetService.getCategoryWithCreatures(params.categoryId);
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

  //======= EFFECTS =======

  private readonly _titleEffect = effect(() => {
    this.typingService.title(this.currentTitle());
  });

  private readonly _categoryChangeEffect = effect(() => {
    this.categoryId();
    this.openCreatureId.set(null);
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

    await this.bestiaireDeleteService.batchDeleteCreatures(selectedIds);
    this.selectedCreatures.set(new Set());
    this.categoryResource.reload();
  }

  async deleteSelectedCategories(): Promise<void> {
    const selectedIds = Array.from(this.selectedCategories());
    if (selectedIds.length === 0) return;

    await this.bestiaireDeleteService.batchDeleteCategories(selectedIds);
    this.selectedCategories.set(new Set());
    this.categoryResource.reload();
  }

  //======= NAVIGATION =======

  goToCategory(categoryId: number): void {
    if (this.categorySelection()) return;
    this.router.navigate(['/marsball/bestiaire', categoryId]);
  }

  goBack(): void {
    const data = this.categoryData();
    if (data?.category.parentId) {
      this.router.navigate(['/marsball/bestiaire', data.category.parentId]);
    } else {
      this.router.navigate(['/marsball/bestiaire']);
    }
  }
}