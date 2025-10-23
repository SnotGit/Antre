import { Component, OnDestroy, inject, computed, resource, input, signal, effect, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { MarsballGetService, CategoryWithChildren } from '@features/marsball/services/marsball-get.service';
import { MarsballDeleteService } from '@features/marsball/services/marsball-delete.service';
import { MarsballUpdateService } from '@features/marsball/services/marsball-update.service';
import { EditItemService } from '@features/marsball/services/edit-item.service';
import { TypingEffectService } from '@shared/utilities/typing-effect/typing-effect.service';
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

  private readonly router = inject(Router);
  private readonly marsballGetService = inject(MarsballGetService);
  private readonly marsballDeleteService = inject(MarsballDeleteService);
  private readonly marsballUpdateService = inject(MarsballUpdateService);
  protected readonly editItemService = inject(EditItemService);
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
        this.router.navigate(['/marsball']);
        return null;
      }
      
      try {
        return await this.marsballGetService.getCategoryWithChildren(params.categoryId);
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

  selection = computed(() => this.selectedItems().size > 0);
  categorySelection = computed(() => this.selectedCategories().size > 0);

  currentTitle = computed(() => {
    const data = this.categoryData();
    return data?.category.title || 'Marsball';
  });

  editThumbnailPreview = computed(() => {
    const crop = this.editItemService.crop();
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

  //======= CROP DRAG METHODS =======

  onCropMouseDown(event: MouseEvent, container: HTMLElement): void {
    event.preventDefault();
    const rect = container.getBoundingClientRect();
    this.editItemService.startDrag(event, rect);
    
    const onMouseMove = (e: MouseEvent) => {
      const r = container.getBoundingClientRect();
      this.editItemService.onDrag(e, r);
    };
    
    const onMouseUp = () => {
      this.editItemService.stopDrag();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  //======= ADMIN ACTIONS =======

  editItem(itemId: number): void {
    const data = this.categoryData();
    if (!data) return;

    const item = data.items.find(i => i.id === itemId);
    if (!item) return;

    this.editItemService.startEdit(itemId, item.title, item.description || '', item.imageUrl);
  }

  cancelEdit(): void {
    this.editItemService.cancelEdit();
  }

  async saveEdit(): Promise<void> {
    const itemId = this.editItemService.isEditing();
    if (itemId === null) return;

    const title = this.editItemService.title();
    const description = this.editItemService.description();
    const crop = this.editItemService.crop();
    const container = this.imageContainer?.nativeElement;

    if (!title.trim() || !container) return;

    const displayWidth = container.clientWidth;
    const displayHeight = container.clientHeight;

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
      this.openItemId.set(null);
      this.categoryResource.reload();
    } catch (error) {
      console.error('Erreur:', error);
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

  async deleteSelected(): Promise<void> {
    const data = this.categoryData();
    if (!data) return;

    const selectedIds = Array.from(this.selectedItems());
    if (selectedIds.length === 0) return;

    const selectedNames = data.items
      .filter(item => selectedIds.includes(item.id))
      .map(item => item.title);

    await this.marsballDeleteService.deleteItems(selectedIds, selectedNames);
    this.selectedItems.set(new Set());
    this.categoryResource.reload();
  }

  async deleteSelectedCategories(): Promise<void> {
    const data = this.categoryData();
    if (!data) return;

    const selectedIds = Array.from(this.selectedCategories());
    if (selectedIds.length === 0) return;

    const selectedNames = data.children
      .filter(cat => selectedIds.includes(cat.id))
      .map(cat => cat.title);

    await this.marsballDeleteService.deleteCategories(selectedIds, selectedNames);
    this.selectedCategories.set(new Set());
    this.categoryResource.reload();
  }

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