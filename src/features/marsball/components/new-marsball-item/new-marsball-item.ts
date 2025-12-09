import { Component, OnDestroy, inject, signal, computed, effect, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NewItemService } from '@features/marsball/services/new-marsball-item.service';
import { MarsballCreateService } from '@features/marsball/services/marsball-create.service';
import { ConfirmationDialogService } from '@features/marsball/services/confirmation-dialog.service';
import { CropService } from '@shared/utilities/crop-images/crop.service';
import { FileNameFormatterService } from '@shared/utilities/file-name-formatter/file-name-formatter.service';
import { OverlayTypingEffectService } from '@shared/utilities/typing-effect/overlay-typing-effect.service';

interface ImageFile {
  file: File;
  preview: string;
}

@Component({
  selector: 'app-new-marsball-item',
  imports: [FormsModule],
  templateUrl: './new-marsball-item.html',
  styleUrl: './new-marsball-item.scss'
})
export class NewMarsballItem implements OnDestroy, AfterViewInit {

  //======= INJECTIONS =======

  protected readonly newItemService = inject(NewItemService);
  private readonly marsballCreateService = inject(MarsballCreateService);
  private readonly confirmationService = inject(ConfirmationDialogService);
  protected readonly cropService = inject(CropService);
  private readonly fileNameFormatter = inject(FileNameFormatterService);
  private readonly overlayTypingService = inject(OverlayTypingEffectService);

  //======= TYPING EFFECT =======

  private readonly title = 'Nouvel Item';

  headerTitle = this.overlayTypingService.headerTitle;
  typing = this.overlayTypingService.typingComplete;

  //======= VIEW CHILDREN =======

  @ViewChild('uploadZone') uploadZone?: ElementRef<HTMLDivElement>;
  @ViewChild('descriptionInput') descriptionInput?: ElementRef<HTMLTextAreaElement>;

  //======= SIGNALS =======

  itemTitle = signal('');
  itemDescription = signal('');
  mainImage = signal<ImageFile | null>(null);
  descriptionImage = signal<ImageFile | null>(null);

  //======= COMPUTED =======

  canCreate = computed(() => {
    return this.itemTitle().trim().length > 0 && this.mainImage() !== null;
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

  thumbnailPreview = computed(() => {
    const img = this.mainImage();
    const crop = this.cropService.crop();
    
    if (!img) return null;

    return {
      backgroundImage: `url(${img.preview})`,
      backgroundPosition: `-${crop.x}px -${crop.y}px`,
      backgroundSize: 'auto'
    };
  });

  //======= EFFECTS =======

  private readonly _typingEffect = effect(() => {
    if (this.newItemService.isVisible()) {
      this.overlayTypingService.title(this.title);
    }
  });

  private readonly _focusEffect = effect(() => {
    if (this.newItemService.isVisible() && !this.mainImage()) {
      setTimeout(() => this.uploadZone?.nativeElement.focus(), 100);
    }
  });

  //======= LIFECYCLE =======

  ngAfterViewInit(): void {
    const uploadZone = this.uploadZone?.nativeElement;
    if (uploadZone) {
      uploadZone.addEventListener('paste', this.onPaste.bind(this));
    }
  }

  ngOnDestroy(): void {
    const uploadZone = this.uploadZone?.nativeElement;
    if (uploadZone) {
      uploadZone.removeEventListener('paste', this.onPaste.bind(this));
    }
    this.cleanupImages();
    this.overlayTypingService.destroy();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.newItemService.isVisible()) {
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
    this.cropService.init(60);
    
    if (this.itemTitle().trim().length === 0) {
      const formattedTitle = this.fileNameFormatter.format(file);
      this.itemTitle.set(formattedTitle);
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
    this.itemDescription.set('');
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
    this.uploadZone?.nativeElement.blur();
  }

  //======= FORM ACTIONS =======

  async createItem(): Promise<void> {
    if (!this.canCreate()) return;

    const categoryId = this.newItemService.contextCategoryId();
    const img = this.mainImage();
    
    if (categoryId === null || !img) return;

    const container = document.querySelector('.image-preview-container') as HTMLElement;
    const imgElement = container?.querySelector('img') as HTMLImageElement;
    
    if (!container || !imgElement) return;

    const crop = this.cropService.crop();
    const description = this.itemDescription().trim();
    
    const displayWidth = imgElement.naturalWidth;
    const displayHeight = imgElement.naturalHeight;

    try {
      await this.marsballCreateService.createItem(
        this.itemTitle().trim(),
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
      this.newItemService.close();
      
      window.location.reload();
    } catch {
      this.confirmationService.showErrorMessage();
    }
  }

  cancel(): void {
    this.resetForm();
    this.newItemService.close();
  }

  //======= CLEANUP =======

  private resetForm(): void {
    this.cleanupImages();
    this.itemTitle.set('');
    this.itemDescription.set('');
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