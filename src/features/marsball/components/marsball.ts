import { Component, OnInit, OnDestroy, inject, computed, resource, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MarsballGetService, MarsballCategory } from '@features/marsball/services/marsball-get.service';
import { MarsballDeleteService } from '@features/marsball/services/marsball-delete.service';
import { ConfirmationDialogService } from '@features/marsball/services/confirmation-dialog.service';
import { TypingEffectService } from '@shared/utilities/typing-effect/typing-effect.service';
import { AuthService } from '@features/auth/services/auth.service';

@Component({
  selector: 'app-marsball',
  imports: [],
  templateUrl: './marsball.html',
  styleUrl: './marsball.scss'
})
export class Marsball implements OnInit, OnDestroy {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly marsballGetService = inject(MarsballGetService);
  private readonly marsballDeleteService = inject(MarsballDeleteService);
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly typingService = inject(TypingEffectService);
  private readonly authService = inject(AuthService);

  //======= TYPING EFFECT =======

  private readonly title = 'Marsball';

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //======= SIGNALS =======

  selectedCategories = signal<Set<number>>(new Set());
  isAdmin = this.authService.isAdmin;

  //======= DATA LOADING =======

  private readonly categoriesResource = resource({
    loader: async () => {
      return await this.marsballGetService.getRootCategories();
    }
  });

  categories = computed((): MarsballCategory[] => {
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

    try {
      await this.marsballDeleteService.deleteCategories(selectedIds);
      
      this.selectedCategories.set(new Set());
      this.confirmationService.showSuccessMessage();
      this.categoriesResource.reload();
    } catch (error) {
      this.confirmationService.showErrorMessage();
    }
  }

  //======= NAVIGATION =======

  onCardClick(category: MarsballCategory): void {
    if (this.selection()) return;
    this.router.navigate(['/marsball', category.id]);
  }
}