import { Component, OnDestroy, inject, computed, resource, input, signal, effect, ViewChild, ElementRef } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { VaultGetService } from '@shared/vault/services/vault-get.service';
import { VaultDeleteService } from '@shared/vault/services/vault-delete.service';
import { VaultUpdateService } from '@shared/vault/services/vault-update.service';
import { VaultContextService } from '@shared/vault/services/vault-context.service';
import { CategoryWithChildren } from '@shared/vault/models/vault.models';
import { CategoryStateService } from '@features/marsball/services/category-state.service';
import { ConsoleStateService } from '@features/menus/services/console-state.service';
import { VaultEditEntryService } from '@shared/vault/services/vault-edit-entry.service';
import { VaultNewEntryService } from '@shared/vault/services/vault-new-entry.service';
import { CropService } from '@shared/services/crop-images/crop.service';
import { AdminDialogService } from '@shared/services/dialog/admin-dialog.service';
import { AuthService } from '@features/auth/services/auth.service';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-rover-category',
  imports: [],
  templateUrl: './rover-category.html',
  styleUrl: './rover-category.scss'
})
export class RoverCategory implements OnDestroy {

  //======= INJECTIONS =======

  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly vaultGetService = inject(VaultGetService);
  private readonly vaultDeleteService = inject(VaultDeleteService);
  private readonly vaultUpdateService = inject(VaultUpdateService);
  private readonly vaultContext = inject(VaultContextService);
  private readonly categoryState = inject(CategoryStateService);
  private readonly consoleState = inject(ConsoleStateService);
  protected readonly editItemService = inject(VaultEditEntryService);
  protected readonly cropService = inject(CropService);
  private readonly authService = inject(AuthService);
  private readonly confirmationService = inject(AdminDialogService);
  private readonly newEntryService = inject(VaultNewEntryService);
  private readonly API_URL = environment.apiUrl;

  //======= VIEW CHILDREN =======

  @ViewChild('imageContainer') imageContainer?: ElementRef<HTMLDivElement>;

  //======= ROUTER INPUTS =======

  titleUrl = input.required<string>();

  //======= ROUTER STATE =======

  private readonly routerState = history.state;
  private readonly routerStateCategoryId = this.routerState?.categoryId || 0;

  //======= SIGNALS =======

  openItemId = signal<number | null>(null);
  isAdmin = this.authService.isAdmin;

  //======= STATE SERVICE =======

  selectedItems = this.categoryState.selectedItems;
  selectedCategories = this.categoryState.selectedCategories;
  selection = this.categoryState.selectionItems;
  categorySelection = this.categoryState.selectionCategories;

  //======= CONSTRUCTOR =======

  constructor() {
    this.vaultContext.setContext('rover');
  }

  //======= DATA LOADING =======

  private readonly categoryResource = resource({
    loader: async () => {
      if (!this.routerStateCategoryId) {
        this.router.navigate(['/marsball/rover']);
        return null;
      }

      try {
        return await this.vaultGetService.getCategoryWithChildren(this.routerStateCategoryId);
      } catch {
        this.router.navigate(['/marsball/rover']);
        return null;
      }
    }
  });

  categoryData = computed((): CategoryWithChildren | null => {
    return this.categoryResource.value() || null;
  });

  //======= COMPUTED =======

  cropStyle = computed(() => {
    const crop = this.cropService.crop();
    return {
      left: `${crop.x}px`,
      top: `${crop.y}px`,
      width: `${crop.size}px`,
      height: `${crop.size}px`
    };
  });

  editThumbnailPreview = computed(() => {
    const crop = this.cropService.crop();
    const imageUrl = this.editItemService.image();

    return {
      backgroundImage: `url(${this.getImageUrl(imageUrl)})`,
      backgroundPosition: `-${crop.x}px -${crop.y}px`,
      backgroundSize: 'auto'
    };
  });

  //======= EFFECTS =======

  private readonly _categoryChangeEffect = effect(() => {
    this.titleUrl();
    this.openItemId.set(null);
  });

  private readonly _deleteRequestEffect = effect(() => {
    this.consoleState.deleteRequested();
    this.handleDeleteRequest();
  });

  private readonly _refreshEffect = effect(() => {
    this.newEntryService.refreshCounter();
    this.categoryResource.reload();
  });

  //======= DELETE HANDLER =======

  private async handleDeleteRequest(): Promise<void> {
    const data = this.categoryData();
    if (!data) return;

    if (this.categoryState.selectionItems()) {
      await this.categoryState.deleteSelectedItems(data.entries, this.vaultDeleteService);
    }
    if (this.categoryState.selectionCategories()) {
      await this.categoryState.deleteSelectedCategories(data.children, this.vaultDeleteService);
    }

    this.categoryResource.reload();
  }

  //======= LIFECYCLE =======

  ngOnDestroy(): void {
    this.categoryState.clearAllSelections();
  }

  //======= ITEM ACTIONS =======

  toggleItem(itemId: number): void {
    if (this.selection()) return;
    if (this.editItemService.isEditing()) return;
    this.openItemId.set(this.openItemId() === itemId ? null : itemId);
  }

  closeItem(): void {
    this.openItemId.set(null);
  }

  isItemOpen(itemId: number): boolean {
    return this.openItemId() === itemId;
  }

  getImageUrl(imageUrl: string): string {
    return `${this.API_URL.replace('/api', '')}${imageUrl}`;
  }

  //======= SELECTION METHODS =======

  toggleSelection(itemId: number): void {
    this.categoryState.toggleItemSelection(itemId);
  }

  isSelected(itemId: number): boolean {
    return this.categoryState.selectedItems().has(itemId);
  }

  toggleCategorySelection(categoryId: number): void {
    this.categoryState.toggleCategorySelection(categoryId);
  }

  isSelectedCategory(categoryId: number): boolean {
    return this.categoryState.selectedCategories().has(categoryId);
  }

  //======= CROP METHODS =======

  onCropMouseDown(event: MouseEvent, container: HTMLElement): void {
    const rect = container.getBoundingClientRect();
    this.cropService.startMove(event, rect);
  }

  onResizeMouseDown(event: MouseEvent, corner: 'tl' | 'tr' | 'bl' | 'br', container: HTMLElement): void {
    const rect = container.getBoundingClientRect();
    this.cropService.startResize(event, corner, rect);
  }

  onMouseMove(event: MouseEvent, container: HTMLElement): void {
    const rect = container.getBoundingClientRect();
    this.cropService.onDrag(event, rect);
  }

  onMouseUp(): void {
    this.cropService.stopDrag();
  }

  //======= EDIT INPUT HANDLERS =======

  onEditTitleInput(event: Event): void {
    this.editItemService.updateTitle((event.target as HTMLInputElement).value);
  }

  onEditDescriptionInput(event: Event): void {
    this.editItemService.updateDescription((event.target as HTMLTextAreaElement).value);
  }

  //======= ADMIN ACTIONS =======

  editItem(itemId: number): void {
    const data = this.categoryData();
    if (!data) return;

    const item = data.entries.find(i => i.id === itemId);
    if (!item) return;

    this.editItemService.startEdit(itemId, item.title, item.description || '', item.imageUrl);

    setTimeout(() => {
      this.cropService.init(60);
    }, 0);
  }

  cancelEdit(): void {
    this.editItemService.cancelEdit();
    this.cropService.reset();
  }

  async saveEdit(): Promise<void> {
    const itemId = this.editItemService.isEditing();
    if (itemId === null) return;

    const title = this.editItemService.title();
    const description = this.editItemService.description();
    const crop = this.cropService.crop();
    const container = this.imageContainer?.nativeElement;
    const imgElement = container?.querySelector('img') as HTMLImageElement;

    if (!title.trim() || !container || !imgElement) return;

    const displayWidth = imgElement.naturalWidth;
    const displayHeight = imgElement.naturalHeight;

    try {
      if (this.editItemService.imageChanged()) {
        const imageFile = this.editItemService.imageFile();
        if (!imageFile) return;

        await this.vaultUpdateService.updateEntry(
          itemId,
          title,
          description,
          crop.x,
          crop.y,
          crop.size,
          displayWidth,
          displayHeight,
          imageFile
        );
      } else {
        await this.vaultUpdateService.updateEntry(
          itemId,
          title,
          description,
          crop.x,
          crop.y,
          crop.size,
          displayWidth,
          displayHeight,
          undefined,
          imgElement
        );
      }

      this.editItemService.cancelEdit();
      this.cropService.reset();
      this.openItemId.set(null);
      this.categoryResource.reload();
    } catch {
      this.confirmationService.showErrorMessage();
    }
  }

  async deleteItem(itemId: number): Promise<void> {
    const data = this.categoryData();
    if (!data) return;

    const item = data.entries.find(i => i.id === itemId);
    if (!item) return;

    await this.vaultDeleteService.deleteEntry(itemId, item.title);
    this.categoryResource.reload();
  }

  //======= NAVIGATION =======

  goToCategory(categoryId: number): void {
    const data = this.categoryData();
    if (!data) return;

    const category = data.children.find(c => c.id === categoryId);
    if (!category) return;

    this.router.navigate(['/marsball/rover', category.title.toLowerCase().replace(/\s+/g, '-')], {
      state: {
        categoryId: category.id
      }
    });
  }

  goBack(): void {
    const data = this.categoryData();
    if (data?.category.parentId) {
      this.location.back();
    } else {
      this.router.navigate(['/marsball/rover']);
    }
  }
}
