import { Component, OnInit, OnDestroy, inject, computed, resource, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BestiaireGetService } from '../services/bestiaire-get.service';
import { BestiaireDeleteService } from '../services/bestiaire-delete.service';
import { BestiaireCategory } from '../models/bestiaire.models';
import { TypingEffectService } from '@shared/utilities/typing-effect/typing-effect.service';
import { AuthService } from '@features/auth/services/auth.service';

@Component({
  selector: 'app-bestiaire',
  imports: [],
  templateUrl: './bestiaire.html',
  styleUrl: './bestiaire.scss'
})
export class Bestiaire implements OnInit, OnDestroy {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly bestiaireGetService = inject(BestiaireGetService);
  private readonly bestiaireDeleteService = inject(BestiaireDeleteService);
  private readonly typingService = inject(TypingEffectService);
  private readonly authService = inject(AuthService);

  //======= TYPING EFFECT =======

  private readonly title = 'Bestiaire';

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //======= SIGNALS =======

  selectedCategories = signal<Set<number>>(new Set());
  isAdmin = this.authService.isAdmin;

  //======= DATA LOADING =======

  private readonly categoriesResource = resource({
    loader: async () => {
      return await this.bestiaireGetService.getRootCategories();
    }
  });

  categories = computed((): BestiaireCategory[] => {
    return this.categoriesResource.value() || [];
  });

  //======= COMPUTED =======

  selection = computed(() => this.selectedCategories().size > 0);

  //======= LIFECYCLE =======

  ngOnInit(): void {
    this.typingService.title(this.title);
  }

  ngOnDestroy(): void {
    this.typingService.destroy();
  }

  //======= SELECTION METHODS =======

  toggleSelection(categoryId: number): void {
    const newSelection = new Set(this.selectedCategories());
    if (newSelection.has(categoryId)) {
      newSelection.delete(categoryId);
    } else {
      newSelection.add(categoryId);
    }
    this.selectedCategories.set(newSelection);
  }

  isSelected(categoryId: number): boolean {
    return this.selectedCategories().has(categoryId);
  }

  //======= ADMIN ACTIONS =======

  async deleteSelected(): Promise<void> {
    const selectedIds = Array.from(this.selectedCategories());
    if (selectedIds.length === 0) return;

    await this.bestiaireDeleteService.batchDeleteCategories(selectedIds);
    this.selectedCategories.set(new Set());
    this.categoriesResource.reload();
  }

  //======= NAVIGATION =======

  onCardClick(category: BestiaireCategory): void {
    if (this.selection()) return;
    this.router.navigate(['/marsball/bestiaire', category.id]);
  }
}