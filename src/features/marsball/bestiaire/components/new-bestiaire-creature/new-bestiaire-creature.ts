import { Component, OnDestroy, inject, signal, computed, effect, ElementRef, viewChild, AfterViewInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VaultNewEntryService } from '@shared/vault/services/vault-new-entry.service';
import { VaultCreateService } from '@shared/vault/services/vault-create.service';
import { AdminDialogService } from '@shared/services/dialog/admin-dialog.service';
import { CropService } from '@shared/services/crop-images/crop.service';
import { FileNameFormatterService } from '@shared/services/file-name-formatter/file-name-formatter.service';
import { OverlayTypingEffectService } from '@shared/services/typing-effect/overlay-typing-effect.service';

interface ImageFile {
  file: File;
  preview: string;
}

@Component({
  selector: 'app-new-bestiaire-creature',
  imports: [FormsModule],
  templateUrl: './new-bestiaire-creature.html',
  styleUrl: './new-bestiaire-creature.scss'
})
export class NewBestiaireCreature implements OnDestroy, AfterViewInit {

  //======= INJECTIONS =======

  protected readonly newCreatureService = inject(VaultNewEntryService);
  private readonly vaultCreateService = inject(VaultCreateService);
  private readonly confirmationService = inject(AdminDialogService);
  protected readonly cropService = inject(CropService);
  private readonly fileNameFormatter = inject(FileNameFormatterService);
  private readonly overlayTypingService = inject(OverlayTypingEffectService);

  //======= TYPING EFFECT =======

  private readonly title = 'Nouvelle Créature';

  headerTitle = this.overlayTypingService.headerTitle;
  typing = this.overlayTypingService.typingComplete;

  //======= BOUND HANDLERS =======

  private readonly boundOnPaste = this.onPaste.bind(this);

  //======= VIEW CHILDREN =======

  private readonly uploadZone = viewChild<ElementRef<HTMLDivElement>>('uploadZone');
  private readonly descriptionInput = viewChild<ElementRef<HTMLTextAreaElement>>('descriptionInput');
  private readonly imageContainer = viewChild<ElementRef<HTMLDivElement>>('imageContainer');

  //======= SIGNALS =======

  creatureTitle = signal('');
  creatureDescription = signal('');
  mainImage = signal<ImageFile | null>(null);
  descriptionImage = signal<ImageFile | null>(null);

  //======= COMPUTED =======

  canCreate = computed(() => {
    return this.creatureTitle().trim().length > 0 && this.mainImage() !== null;
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

  private readonly displayedRatio = computed(() => {
    const img = this.mainImage();
    if (!img || !this.imageContainer()?.nativeElement) return 1;

    const container = this.imageContainer()!.nativeElement;
    const imgElement = container.querySelector('img') as HTMLImageElement;

    if (!imgElement || !imgElement.naturalWidth) return 1;

    return imgElement.naturalWidth / imgElement.width;
  });

  thumbnailPreview = computed(() => {
    const img = this.mainImage();
    const crop = this.cropService.crop();
    const ratio = this.displayedRatio();

    if (!img) return null;

    const realX = crop.x * ratio;
    const realY = crop.y * ratio;
    const realSize = crop.size * ratio;

    const thumbSize = 60;
    const scale = thumbSize / realSize;

    const containerWidth = this.imageContainer()?.nativeElement?.clientWidth || 0;
    const realImageWidth = containerWidth * ratio;

    const bgWidth = realImageWidth * scale;
    const bgPosX = -(realX * scale);
    const bgPosY = -(realY * scale);

    return {
      backgroundImage: `url(${img.preview})`,
      backgroundPosition: `${bgPosX}px ${bgPosY}px`,
      backgroundSize: `${bgWidth}px auto`
    };
  });

  //======= SIGNALS =======

  isVisible = computed((): boolean => this.newCreatureService.isVisible() && this.newCreatureService.activeContext() === 'bestiaire');

  //======= EFFECTS =======

  private readonly _typingEffect = effect(() => {
    if (this.isVisible()) {
      this.overlayTypingService.title(this.title);
    }
  });

  private readonly _focusEffect = effect(() => {
    if (this.isVisible() && !this.mainImage()) {
      setTimeout(() => this.uploadZone()?.nativeElement.focus(), 100);
    }
  });

  //======= LIFECYCLE =======

  ngAfterViewInit(): void {
    const uploadZone = this.uploadZone()?.nativeElement;
    if (uploadZone) {
      uploadZone.addEventListener('paste', this.boundOnPaste);
    }
  }

  ngOnDestroy(): void {
    const uploadZone = this.uploadZone()?.nativeElement;
    if (uploadZone) {
      uploadZone.removeEventListener('paste', this.boundOnPaste);
    }
    this.cleanupImages();
    this.overlayTypingService.destroy();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isVisible()) {
      this.cancel();
    }
  }

  //======= PASTE HANDLER =======

  private onPaste(event: ClipboardEvent): void {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          this.setMainImage(file);
          event.preventDefault();
          break;
        }
      }
    }
  }

  //======= IMAGE UPLOAD - MAIN =======

  onMainFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.setMainImage(input.files[0]);
      input.value = '';
    }
  }

  onMainDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.setMainImage(event.dataTransfer.files[0]);
    }
  }

  onMainDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private setMainImage(file: File): void {
    const oldImage = this.mainImage();
    if (oldImage) {
      URL.revokeObjectURL(oldImage.preview);
    }

    const preview = URL.createObjectURL(file);
    this.mainImage.set({ file, preview });
    this.cropService.initWithPosition(200, 20, 20);

    if (this.creatureTitle().trim().length === 0) {
      const formattedTitle = this.fileNameFormatter.format(file);
      this.creatureTitle.set(formattedTitle);
    }
  }

  removeMainImage(): void {
    const img = this.mainImage();
    if (img) {
      URL.revokeObjectURL(img.preview);
      this.mainImage.set(null);
    }
  }

  //======= IMAGE UPLOAD - DESCRIPTION =======

  onDescriptionFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.setDescriptionImage(input.files[0]);
      input.value = '';
    }
  }

  private setDescriptionImage(file: File): void {
    const oldImage = this.descriptionImage();
    if (oldImage) {
      URL.revokeObjectURL(oldImage.preview);
    }

    const preview = URL.createObjectURL(file);
    this.descriptionImage.set({ file, preview });
    this.creatureDescription.set('');
  }

  removeDescriptionImage(): void {
    const img = this.descriptionImage();
    if (img) {
      URL.revokeObjectURL(img.preview);
      this.descriptionImage.set(null);
    }
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

  blurUploadZone(): void {
    this.uploadZone()?.nativeElement.blur();
  }

  //======= FORM ACTIONS =======

  async createCreature(): Promise<void> {
    if (!this.canCreate()) return;

    const categoryId = this.newCreatureService.contextCategoryId();
    const img = this.mainImage();

    if (categoryId === null || !img) return;

    const container = this.imageContainer()?.nativeElement;
    const imgElement = container?.querySelector('img') as HTMLImageElement;

    if (!container || !imgElement) return;

    const crop = this.cropService.crop();
    const description = this.creatureDescription().trim();

    const displayWidth = imgElement.width;
    const displayHeight = imgElement.height;

    try {
      await this.vaultCreateService.createEntry(
        this.creatureTitle().trim(),
        categoryId,
        img.file,
        crop.x,
        crop.y,
        crop.size,
        displayWidth,
        displayHeight,
        description || undefined
      );

      this.confirmationService.showSuccessMessage();
      this.resetForm();
      this.newCreatureService.notifyCreated();
      this.newCreatureService.close();
    } catch {
      this.confirmationService.showErrorMessage();
    }
  }

  cancel(): void {
    this.resetForm();
    this.newCreatureService.close();
  }

  //======= CLEANUP =======

  private resetForm(): void {
    this.cleanupImages();
    this.creatureTitle.set('');
    this.creatureDescription.set('');
    this.cropService.reset();
  }

  private cleanupImages(): void {
    const main = this.mainImage();
    if (main) URL.revokeObjectURL(main.preview);

    const desc = this.descriptionImage();
    if (desc) URL.revokeObjectURL(desc.preview);

    this.mainImage.set(null);
    this.descriptionImage.set(null);
  }
}
