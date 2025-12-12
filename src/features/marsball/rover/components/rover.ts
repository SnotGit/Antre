import { Component, OnInit, OnDestroy, inject, computed, resource, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RoverGetService } from '../services/rover-get.service';
import { RoverDeleteService } from '../services/rover-delete.service';
import { RoverCategory } from '../models/rover.models';
import { TypingEffectService } from '@shared/services/typing-effect/typing-effect.service';
import { AuthService } from '@features/auth/services/auth.service';

@Component({
  selector: 'app-rover',
  imports: [],
  templateUrl: './rover.html',
  styleUrl: './rover.scss'
})
export class Rover implements OnInit, OnDestroy {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly roverGetService = inject(RoverGetService);
  private readonly roverDeleteService = inject(RoverDeleteService);
  private readonly typingService = inject(TypingEffectService);
  private readonly authService = inject(AuthService);

  //======= TYPING EFFECT =======

  private readonly title = 'Rover';

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //======= SIGNALS =======

  selectedCategories = signal<Set<number>>(new Set());
  isAdmin = this.authService.isAdmin;

  //======= DATA LOADING =======

  private readonly categoriesResource = resource({
    loader: async () => {
      return await this.roverGetService.getRootCategories();
    }
  });

  categories = computed((): RoverCategory[] => {
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

    await this.roverDeleteService.batchDeleteCategories(selectedIds);
    this.selectedCategories.set(new Set());
    this.categoriesResource.reload();
  }

  //======= NAVIGATION =======

  onCardClick(category: RoverCategory): void {
    if (this.selection()) return;
    this.router.navigate(['/marsball/rover', category.id]);
  }

  goBack(): void {
    this.router.navigate(['/marsball']);
  }
}
