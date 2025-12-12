import { Component, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CreateCategoryService } from '../../services/category/create-category.service';
import { MarsballCreateService } from '@features/marsball/services/marsball-create.service';
import { RoverCreateService } from '@features/marsball/rover/services/rover-create.service';
import { BestiaireCreateService } from '@features/marsball/bestiaire/services/bestiaire-create.service';
import { AdminDialogService } from '@shared/services/dialog/admin-dialog.service';
import { OverlayTypingEffectService } from '@shared/services/typing-effect/overlay-typing-effect.service';

type CategoryType = 'marsball' | 'rover' | 'bestiaire';

@Component({
  selector: 'app-create-category',
  imports: [FormsModule],
  templateUrl: './create-category.html',
  styleUrl: './create-category.scss'
})
export class CreateCategory implements OnDestroy {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  protected readonly createCategoryService = inject(CreateCategoryService);
  private readonly marsballCreateService = inject(MarsballCreateService);
  private readonly roverCreateService = inject(RoverCreateService);
  private readonly bestiaireCreateService = inject(BestiaireCreateService);
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

  private readonly detectedType = computed((): CategoryType => {
    const url = this.router.url;
    if (url.includes('/marsball/bestiaire')) return 'bestiaire';
    if (url.includes('/marsball/rover')) return 'rover';
    return 'marsball';
  });

  private readonly createService = computed(() => {
    const categoryType = this.detectedType();
    switch (categoryType) {
      case 'marsball':
        return this.marsballCreateService;
      case 'rover':
        return this.roverCreateService;
      case 'bestiaire':
        return this.bestiaireCreateService;
    }
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
    const service = this.createService();

    try {
      await service.createCategory(
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
