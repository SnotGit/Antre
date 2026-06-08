import { Component, inject, computed, input, output, signal, effect, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { VaultEntry } from '@shared/vault/models/vault.models';
import { VaultEditEntryService } from '@shared/vault/services/vault-edit-entry.service';
import { VaultUpdateService } from '@shared/vault/services/vault-update.service';
import { VaultDeleteService } from '@shared/vault/services/vault-delete.service';
import { CropService } from '@shared/services/crop-images/crop.service';
import { AdminDialogService } from '@shared/services/dialog/admin-dialog.service';
import { CategoryStateService } from '@features/marsball/services/category-state.service';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-item-view',
  imports: [],
  templateUrl: './item-view.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './item-view.scss'
})
export class ItemView {

  private readonly editItemService = inject(VaultEditEntryService);
  private readonly vaultUpdateService = inject(VaultUpdateService);
  private readonly vaultDeleteService = inject(VaultDeleteService);
  protected readonly cropService = inject(CropService);
  private readonly confirmationService = inject(AdminDialogService);
  private readonly categoryState = inject(CategoryStateService);
  private readonly API_URL = environment.apiUrl;

  @ViewChild('imageContainer') imageContainer?: ElementRef<HTMLDivElement>;

  entries = input.required<VaultEntry[]>();
  isAdmin = input(false);
  label = input('');

  openChange = output<boolean>();
  changed = output<void>();

  openItemId = signal<number | null>(null);
  protected readonly edit = this.editItemService;

  selectedItems = this.categoryState.selectedItems;
  selection = this.categoryState.selectionItems;

  private readonly _resetOnEntriesChange = effect(() => {
    this.entries();
    this.openItemId.set(null);
    this.openChange.emit(false);
  });

  selectedEntry = computed((): VaultEntry | null => {
    const id = this.openItemId();
    if (id === null) return null;
    return this.entries().find(e => e.id === id) ?? null;
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
    return {
      backgroundPosition: `-${crop.x}px -${crop.y}px`,
      backgroundSize: 'auto'
    };
  });

  getImageUrl(imageUrl: string): string {
    return `${this.API_URL.replace('/api', '')}${imageUrl}`;
  }

  selectItem(itemId: number): void {
    if (this.selection()) return;
    if (this.editItemService.isEditing()) return;
    this.openItemId.set(itemId);
    this.openChange.emit(true);
  }

  isItemOpen(itemId: number): boolean {
    return this.openItemId() === itemId;
  }

  toggleSelection(itemId: number): void {
    this.categoryState.toggleItemSelection(itemId);
  }

  isSelected(itemId: number): boolean {
    return this.categoryState.selectedItems().has(itemId);
  }

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

  onEditTitleInput(event: Event): void {
    this.editItemService.updateTitle((event.target as HTMLInputElement).value);
  }

  onEditDescriptionInput(event: Event): void {
    this.editItemService.updateDescription((event.target as HTMLTextAreaElement).value);
  }

  startEdit(): void {
    const item = this.selectedEntry();
    if (!item) return;

    this.editItemService.startEdit(item.id, item.title, item.description || '', item.imageUrl);

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
      this.openChange.emit(false);
      this.changed.emit();
    } catch {
      this.confirmationService.showErrorMessage();
    }
  }

  async deleteItem(): Promise<void> {
    const item = this.selectedEntry();
    if (!item) return;

    await this.vaultDeleteService.deleteEntry(item.id, item.title);
    this.openItemId.set(null);
    this.openChange.emit(false);
    this.changed.emit();
  }
}
