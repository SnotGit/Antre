import { Component, OnDestroy, inject, computed, resource, input, signal, effect, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { RoverGetService } from '../../services/rover-get.service';
import { CategoryWithChildren } from '../../models/rover.models';
import { RoverDeleteService } from '../../services/rover-delete.service';
import { RoverUpdateService } from '../../services/rover-update.service';
import { EditRoverItemService } from '../../services/edit-rover-item.service';
import { CropService } from '@shared/services/crop-images/crop.service';
import { TypingEffectService } from '@shared/services/typing-effect/typing-effect.service';
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

  private readonly router = inject(Router);
  private readonly roverGetService = inject(RoverGetService);
  private readonly roverDeleteService = inject(RoverDeleteService);
  private readonly roverUpdateService = inject(RoverUpdateService);
  protected readonly editItemService = inject(EditRoverItemService);
  protected readonly cropService = inject(CropService);
  private readonly typingService = inject(TypingEffectService);
  private readonly authService = inject(AuthService);
  private readonly API_URL = environment.apiUrl;

  //======= VIEW CHILDREN =======

  @ViewChild('imageContainer') imageContainer?: ElementRef<HTMLDivElement>;

  //======= TYPING EFFECT =======

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //======= ROUTER INPUTS =======

  categoryId = input.required<string>();

  //======= SIGNALS =======

  openItemId = signal<number | null>(null);
  selectedItems = signal<Set<number>>(new Set());
  selectedCategories = signal<Set<number>>(new Set());
  isAdmin = this.authService.isAdmin;

  //======= DATA LOADING =======

  private readonly categoryResource = resource({
    params: () => ({ categoryId: parseInt(this.categoryId(), 10) }),
    loader: async ({ params }) => {
      if (isNaN(params.categoryId)) {
        this.router.navigate(['/marsball/rover']);
        return null;
      }

      try {
        return await this.roverGetService.getCategoryWithChildren(params.categoryId);
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

  selection = computed(() => this.selectedItems().size > 0);
  categorySelection = computed(() => this.selectedCategories().size > 0);

  currentTitle = computed(() => {
    const data = this.categoryData();
    return data?.category.title || 'Rover';
  });

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

  private readonly _titleEffect = effect(() => {
    this.typingService.title(this.currentTitle());
  });

  private readonly _categoryChangeEffect = effect(() => {
    this.categoryId();
    this.openItemId.set(null);
  });

  //======= LIFECYCLE =======

  ngOnDestroy(): void {
    this.typingService.destroy();
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
    const newSelection = new Set(this.selectedItems());
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    this.selectedItems.set(newSelection);
  }

  isSelected(itemId: number): boolean {
    return this.selectedItems().has(itemId);
  }

  //======= CATEGORY SELECTION METHODS =======

  toggleCategorySelection(categoryId: number): void {
    const newSelection = new Set(this.selectedCategories());
    if (newSelection.has(categoryId)) {
      newSelection.delete(categoryId);
    } else {
      newSelection.add(categoryId);
    }
    this.selectedCategories.set(newSelection);
  }

  isSelectedCategory(categoryId: number): boolean {
    return this.selectedCategories().has(categoryId);
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

        await this.roverUpdateService.updateItem(
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
        await this.roverUpdateService.updateItem(
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
      // Ignore update errors
    }
  }

  async deleteItem(itemId: number): Promise<void> {
    const data = this.categoryData();
    if (!data) return;

    const item = data.items.find(i => i.id === itemId);
    if (!item) return;

    await this.roverDeleteService.deleteItem(itemId);
    this.categoryResource.reload();
  }

  async deleteSelected(): Promise<void> {
    const selectedIds = Array.from(this.selectedItems());
    if (selectedIds.length === 0) return;

    await this.roverDeleteService.batchDeleteItems(selectedIds);
    this.selectedItems.set(new Set());
    this.categoryResource.reload();
  }

  async deleteSelectedCategories(): Promise<void> {
    const selectedIds = Array.from(this.selectedCategories());
    if (selectedIds.length === 0) return;

    await this.roverDeleteService.batchDeleteCategories(selectedIds);
    this.selectedCategories.set(new Set());
    this.categoryResource.reload();
  }

  goToCategory(categoryId: number): void {
    this.router.navigate(['/marsball/rover', categoryId]);
  }

  goBack(): void {
    const data = this.categoryData();
    if (data?.category.parentId) {
      this.router.navigate(['/marsball/rover', data.category.parentId]);
    } else {
      this.router.navigate(['/marsball/rover']);
    }
  }
}
