import { Component, OnDestroy, inject, computed, resource, input, signal, effect, ViewChild, ElementRef } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MarsballGetService } from '@features/marsball/services/marsball-get.service';
import { CategoryWithChildren } from '@features/marsball/models/marsball.models';
import { MarsballDeleteService } from '@features/marsball/services/marsball-delete.service';
import { MarsballUpdateService } from '@features/marsball/services/marsball-update.service';
import { CategoryStateService } from '@features/marsball/services/category-state.service';
import { ConsoleStateService } from '@features/menus/services/console-state.service';
import { EditMarsballItemService } from '../../services/edit-marsball-item.service';
import { CropService } from '@shared/services/crop-images/crop.service';
import { AuthService } from '@features/auth/services/auth.service';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-marsball-category',
  imports: [],
  templateUrl: './marsball-category.html',
  styleUrl: './marsball-category.scss'
})
export class MarsballCategory implements OnDestroy {

  //======= INJECTIONS =======

  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly marsballGetService = inject(MarsballGetService);
  private readonly marsballDeleteService = inject(MarsballDeleteService);
  private readonly marsballUpdateService = inject(MarsballUpdateService);
  private readonly categoryState = inject(CategoryStateService);
  private readonly consoleState = inject(ConsoleStateService);
  protected readonly editItemService = inject(EditMarsballItemService);
  protected readonly cropService = inject(CropService);
  private readonly authService = inject(AuthService);
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

  //======= STATE SERVICE COMPUTED =======

  selection = this.categoryState.selectionItems;
  categorySelection = this.categoryState.selectionCategories;
  selectedItems = this.categoryState.selectedItems;
  selectedCategories = this.categoryState.selectedCategories;

  //======= DATA LOADING =======

  private readonly categoryResource = resource({
    loader: async () => {
      if (!this.routerStateCategoryId) {
        this.router.navigate(['/marsball']);
        return null;
      }
      
      try {
        return await this.marsballGetService.getCategoryWithChildren(this.routerStateCategoryId);
      } catch {
        this.router.navigate(['/marsball']);
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

  //======= DELETE HANDLER =======

  private async handleDeleteRequest(): Promise<void> {
  const data = this.categoryData();
  if (!data) return;

  if (this.categoryState.selectionItems()) {
    await this.categoryState.deleteSelectedItems(data.items, this.marsballDeleteService);
  }
  if (this.categoryState.selectionCategories()) {
    await this.categoryState.deleteSelectedCategories(data.children, this.marsballDeleteService);
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

  //======= ITEM SELECTION METHODS =======

  toggleSelection(itemId: number): void {
    this.categoryState.toggleItemSelection(itemId);
  }

  isSelected(itemId: number): boolean {
    return this.categoryState.selectedItems().has(itemId);
  }

  //======= CATEGORY SELECTION METHODS =======

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

  //======= ADMIN ACTIONS =======

  editItem(itemId: number): void {
    const data = this.categoryData();
    if (!data) return;

    const item = data.items.find(i => i.id === itemId);
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

        await this.marsballUpdateService.updateItem(
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
        await this.marsballUpdateService.updateItem(
          itemId,
          title,
          description,
          crop.x,
          crop.y,
          crop.size,
          displayWidth,
          displayHeight
        );
      }

      this.editItemService.cancelEdit();
      this.cropService.reset();
      this.openItemId.set(null);
      this.categoryResource.reload();
    } catch (error) {
    }
  }

  async deleteItem(itemId: number): Promise<void> {
    const data = this.categoryData();
    if (!data) return;

    const item = data.items.find(i => i.id === itemId);
    if (!item) return;

    await this.marsballDeleteService.deleteItem(itemId, item.title);
    this.categoryResource.reload();
  }

  //======= NAVIGATION =======

  goToCategory(categoryId: number): void {
    const data = this.categoryData();
    if (!data) return;

    const category = data.children.find(c => c.id === categoryId);
    if (!category) return;

    this.router.navigate(['/marsball', category.title.toLowerCase().replace(/\s+/g, '-')], {
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
      this.router.navigate(['/marsball']);
    }
  }
}