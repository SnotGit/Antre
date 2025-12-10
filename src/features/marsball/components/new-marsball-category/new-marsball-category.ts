import { Component, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NewCategoryService } from '@shared/utilities/element-state/create-category.service';
import { MarsballCreateService } from '@features/marsball/services/marsball-create.service';
import { AdminDialogService } from '@shared/utilities/confirmation-dialog/admin-dialog.service';
import { OverlayTypingEffectService } from '@shared/utilities/typing-effect/overlay-typing-effect.service';

@Component({
  selector: 'app-new-marsball-category',
  imports: [FormsModule],
  templateUrl: './new-marsball-category.html',
  styleUrl: './new-marsball-category.scss'
})
export class NewMarsballCategory implements OnDestroy {

  //======= INJECTIONS =======

  protected readonly newCategoryService = inject(NewCategoryService);
  private readonly marsballCreateService = inject(MarsballCreateService);
  private readonly confirmationService = inject(AdminDialogService);
  private readonly overlayTypingService = inject(OverlayTypingEffectService);

  //======= TYPING EFFECT =======

  private readonly title = 'Nouvelle Catégorie';

  headerTitle = this.overlayTypingService.headerTitle;
  typing = this.overlayTypingService.typingComplete;

  //======= SIGNALS =======

  categoryTitle = signal('');

  //======= COMPUTED =======

  canCreate = computed(() => {
    return this.categoryTitle().trim().length > 0;
  });

  //======= EFFECTS =======

  private readonly _typingEffect = effect(() => {
    if (this.newCategoryService.isVisible()) {
      this.overlayTypingService.title(this.title);
    }
  });

  //======= LIFECYCLE =======

  ngOnDestroy(): void {
    this.overlayTypingService.destroy();
  }

  //======= ACTIONS =======

  async createCategory(): Promise<void> {
    if (!this.canCreate()) return;

    const parentId = this.newCategoryService.contextParentId();

    try {
      await this.marsballCreateService.createCategory(
        this.categoryTitle().trim(),
        parentId
      );

      this.confirmationService.showSuccessMessage();
      this.categoryTitle.set('');
      this.newCategoryService.close();
      
      window.location.reload();
    } catch {
      this.confirmationService.showErrorMessage();
    }
  }

  cancel(): void {
    this.categoryTitle.set('');
    this.newCategoryService.close();
  }
}