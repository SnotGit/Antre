import { Component, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CreateCategoryService } from '../../services/category/create-category.service';
import { VaultCreateService } from '@shared/vault/services/vault-create.service';
import { AdminDialogService } from '@shared/services/dialog/admin-dialog.service';
import { OverlayTypingEffectService } from '@shared/services/typing-effect/overlay-typing-effect.service';

@Component({
  selector: 'app-create-category',
  imports: [FormsModule],
  templateUrl: './create-category.html',
  styleUrl: './create-category.scss'
})
export class CreateCategory implements OnDestroy {

  //======= INJECTIONS =======

  protected readonly createCategoryService = inject(CreateCategoryService);
  private readonly vaultCreateService = inject(VaultCreateService);
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
    if (this.createCategoryService.isVisible()) {
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

    const parentId = this.createCategoryService.contextParentId();

    try {
      await this.vaultCreateService.createCategory(
        this.categoryTitle().trim(),
        parentId
      );

      this.confirmationService.showSuccessMessage();
      this.categoryTitle.set('');
      this.createCategoryService.close();

      window.location.reload();
    } catch {
      this.confirmationService.showErrorMessage();
    }
  }

  cancel(): void {
    this.categoryTitle.set('');
    this.createCategoryService.close();
  }
}
