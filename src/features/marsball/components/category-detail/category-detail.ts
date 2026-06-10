import { Component, inject, computed, input, output, signal, effect, ViewChild, ElementRef } from '@angular/core';
import { VaultEntry } from '../../models/marsball.models';
import { ItemEditService } from '../../services/item-edit.service';
import { MarsballCrudService } from '../../services/marsball-crud.service';
import { MarsballFeedbackService } from '../../services/marsball-feedback.service';
import { MarsballTreeService } from '../../services/marsball-tree.service';
import { CropService } from '@shared/services/crop-images/crop.service';
import { DialogCardService } from '@shared/services/dialog/dialog-card.service';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-category-detail',
  imports: [],
  templateUrl: './category-detail.html',
  styleUrl: './category-detail.scss'
})
export class CategoryDetail {

  //========== INJECTIONS ==========//

  private readonly editItemService = inject(ItemEditService);
  private readonly crud = inject(MarsballCrudService);
  private readonly dialogCard = inject(DialogCardService);
  private readonly opFeedback = inject(MarsballFeedbackService);
  private readonly tree = inject(MarsballTreeService);
  protected readonly cropService = inject(CropService);
  private readonly API_URL = environment.apiUrl;

  @ViewChild('imageContainer') imageContainer?: ElementRef<HTMLDivElement>;

  //========== INPUTS / OUTPUTS ==========//

  entries = input.required<VaultEntry[]>();
  categoryId = input.required<number>();
  isAdmin = input(false);
  label = input('');

  changed = output<void>();

  //========== SIGNALS ==========//

  openItemId = signal<number | null>(null);
  protected readonly edit = this.editItemService;

  //========== COMPUTED ==========//

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

  //========== EFFECTS ==========//

  private readonly _resetOnEntriesChange = effect(() => {
    this.entries();
    this.openItemId.set(null);
  });

  //========== HELPERS ==========//

  getImageUrl(imageUrl: string): string {
    return `${this.API_URL.replace('/api', '')}${imageUrl}`;
  }

  //========== OUVERTURE ==========//

  selectItem(itemId: number): void {
    if (this.editItemService.isEditing()) return;
    this.openItemId.set(itemId);
  }

  isItemOpen(itemId: number): boolean {
    return this.openItemId() === itemId;
  }

  //========== CROP ==========//

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

  //========== ÉDITION ==========//

  onEditTitleInput(event: Event): void {
    this.editItemService.updateTitle((event.target as HTMLInputElement).value);
  }

  onEditDescriptionInput(event: Event): void {
    this.editItemService.updateDescription((event.target as HTMLTextAreaElement).value);
  }

  private initCrop(): void {
    if (this.tree.activeSection() === 'bestiaire') {
      this.cropService.initWithPosition(200, 20, 20);
    } else {
      this.cropService.initWithPosition(58, 29, 15);
    }
  }

  startEdit(): void {
    const item = this.selectedEntry();
    if (!item) return;

    this.editItemService.startEdit(item.id, item.title, item.description || '', item.imageUrl);

    setTimeout(() => {
      this.initCrop();
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

        await this.crud.updateEntry(
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
        await this.crud.updateEntry(
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
      this.changed.emit();
    } catch {
      this.opFeedback.show('error', 'Échec de la sauvegarde.');
    }
  }

  //========== CRÉATION ==========//

  startCreate(): void {
    this.editItemService.startCreate();
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.editItemService.updateImage(file);

    setTimeout(() => {
      this.initCrop();
    }, 0);
  }

  canCreate = computed(() =>
    this.edit.title().trim().length > 0 && this.edit.imageFile() !== null
  );

  cancelCreate(): void {
    this.editItemService.cancelEdit();
    this.cropService.reset();
  }

  async createItem(): Promise<void> {
    const title = this.editItemService.title().trim();
    const file = this.editItemService.imageFile();
    if (!title || !file) return;

    const crop = this.cropService.crop();

    try {
      await this.crud.createEntry(
        title,
        this.categoryId(),
        file,
        crop.x,
        crop.y,
        crop.size,
        this.editItemService.description() || undefined
      );
      this.editItemService.cancelEdit();
      this.cropService.reset();
      this.opFeedback.show('success', 'Item créé.');
      this.changed.emit();
    } catch {
      this.opFeedback.show('error', 'Échec de la création.');
    }
  }

  //========== SUPPRESSION ==========//

  async deleteItem(): Promise<void> {
    const item = this.selectedEntry();
    if (!item) return;

    const confirmed = await this.dialogCard.showDialog({
      title: 'Suppression',
      message: 'Êtes-vous sûr de vouloir supprimer l\'item sélectionné ?',
      items: [item.title],
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      isDanger: true
    });
    if (!confirmed) return;

    try {
      await this.crud.deleteEntry(item.id);
      this.opFeedback.show('success', 'Item supprimé.');
    } catch {
      this.opFeedback.show('error', 'Échec de la suppression.');
      return;
    }

    this.openItemId.set(null);
    this.changed.emit();
  }
}
