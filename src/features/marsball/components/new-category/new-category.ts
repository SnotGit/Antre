import { Component, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NewCategoryService } from '@features/marsball/services/new-category.service';
import { MarsballCreateService } from '@features/marsball/services/marsball-create.service';
import { ConfirmationDialogService } from '@features/marsball/services/confirmation-dialog.service';
import { TypingEffectService } from '@shared/utilities/typing-effect/typing-effect.service';

@Component({
  selector: 'app-new-category',
  imports: [FormsModule],
  templateUrl: './new-category.html',
  styleUrl: './new-category.scss'
})
export class NewCategory implements OnDestroy {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  protected readonly newCategoryService = inject(NewCategoryService);
  private readonly marsballCreateService = inject(MarsballCreateService);
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly typingService = inject(TypingEffectService);

  //======= TYPING EFFECT =======

  private readonly title = 'Nouvelle Catégorie';

  headerTitle = this.typingService.headerTitle;
  typing = this.typingService.typingComplete;

  //======= SIGNALS =======

  categoryTitle = signal('');

  //======= COMPUTED =======

  canCreate = computed(() => {
    return this.categoryTitle().trim().length > 0;
  });

  //======= EFFECTS =======

  private readonly _typingEffect = effect(() => {
    if (this.newCategoryService.isVisible()) {
      this.typingService.title(this.title);
    }
  });

  //======= LIFECYCLE =======

  ngOnDestroy(): void {
    this.typingService.destroy();
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
    } catch (error) {
      this.confirmationService.showErrorMessage();
    }
  }

  cancel(): void {
    this.categoryTitle.set('');
    this.newCategoryService.close();
  }
}