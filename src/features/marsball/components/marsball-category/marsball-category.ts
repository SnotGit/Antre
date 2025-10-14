import { Component, OnInit, OnDestroy, inject, computed, resource, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MarsballGetService, CategoryWithChildren } from '@features/marsball/services/marsball-get.service';
import { MarsballDeleteService } from '@features/marsball/services/marsball-delete.service';
import { ConfirmationDialogService } from '@features/marsball/services/confirmation-dialog.service';
import { TypingEffectService } from '@shared/utilities/typing-effect/typing-effect.service';
import { AuthService } from '@features/auth/services/auth.service';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-marsball-category',
  imports: [],
  templateUrl: './marsball-category.html',
  styleUrl: './marsball-category.scss'
})
export class MarsballCategory implements OnInit, OnDestroy {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly marsballGetService = inject(MarsballGetService);
  private readonly marsballDeleteService = inject(MarsballDeleteService);
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly typingService = inject(TypingEffectService);
  private readonly authService = inject(AuthService);
  private readonly API_URL = environment.apiUrl;

  //======= TYPING EFFECT =======

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //======= ROUTER INPUTS =======

  categoryId = input.required<string>();

  //======= SIGNALS =======

  openItemId = signal<number | null>(null);
  selectedItems = signal<Set<number>>(new Set());
  isAdmin = this.authService.isAdmin;

  //======= DATA LOADING =======

  private readonly categoryResource = resource({
    params: () => ({ categoryId: parseInt(this.categoryId(), 10) }),
    loader: async ({ params }) => {
      if (isNaN(params.categoryId)) {
        this.router.navigate(['/marsball']);
        return null;
      }
      
      try {
        return await this.marsballGetService.getCategoryWithChildren(params.categoryId);
      } catch (error) {
        this.router.navigate(['/marsball']);
        return null;
      }
    }
  });

  categoryData = computed((): CategoryWithChildren | null => {
    return this.categoryResource.value() || null;
  });

  //======= COMPUTED =======

  selection = computed(() => this.selectedItems().size > 0);

  //======= LIFECYCLE =======

  ngOnInit(): void {
    const data = this.categoryData();
    const title = data?.category.title || 'Marsball';
    this.typingService.title(title);
  }

  ngOnDestroy(): void {
    this.typingService.destroy();
  }

  //======= ITEM ACTIONS =======

  toggleItem(itemId: number): void {
    if (this.selection()) return;
    this.openItemId.set(this.openItemId() === itemId ? null : itemId);
  }

  isItemOpen(itemId: number): boolean {
    return this.openItemId() === itemId;
  }

  getImageUrl(imageUrl: string): string {
    return `${this.API_URL.replace('/api', '')}${imageUrl}`;
  }

  //======= SELECTION METHODS =======

  toggleSelection(itemId: number): void {
    const newSelection = new Set(this.selectedItems());
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    this.selectedItems.set(newSelection);
    this.openItemId.set(null);
  }

  isSelected(itemId: number): boolean {
    return this.selectedItems().has(itemId);
  }

  //======= ADMIN ACTIONS =======

  async deleteCategory(categoryId: number): Promise<void> {
    try {
      await this.marsballDeleteService.deleteCategory(categoryId);
      this.confirmationService.showSuccessMessage();
      this.router.navigate(['/marsball']);
    } catch (error) {
      this.confirmationService.showErrorMessage();
    }
  }

  async deleteItem(itemId: number): Promise<void> {
    try {
      await this.marsballDeleteService.deleteItem(itemId);
      this.confirmationService.showSuccessMessage();
      this.categoryResource.reload();
    } catch (error) {
      this.confirmationService.showErrorMessage();
    }
  }

  async deleteSelected(): Promise<void> {
    const selectedIds = Array.from(this.selectedItems());
    if (selectedIds.length === 0) return;

    try {
      await this.marsballDeleteService.deleteItems(selectedIds);
      
      this.selectedItems.set(new Set());
      this.confirmationService.showSuccessMessage();
      this.categoryResource.reload();
    } catch (error) {
      this.confirmationService.showErrorMessage();
    }
  }

  //======= NAVIGATION =======

  goToCategory(categoryId: number): void {
    this.router.navigate(['/marsball', categoryId]);
  }

  goBack(): void {
    const data = this.categoryData();
    if (data?.category.parentId) {
      this.router.navigate(['/marsball', data.category.parentId]);
    } else {
      this.router.navigate(['/marsball']);
    }
  }
}