import { Component, OnDestroy, inject, signal, computed, effect, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NewItemService } from '@features/marsball/services/new-item.service';
import { MarsballCreateService } from '@features/marsball/services/marsball-create.service';
import { ConfirmationDialogService } from '@features/marsball/services/confirmation-dialog.service';
import { CropService } from '@shared/utilities/crop-images/crop.service';
import { FileNameFormatterService } from '@shared/utilities/file-name-formatter/file-name-formatter.service';

interface ImageFile {
  file: File;
  preview: string;
}

@Component({
  selector: 'app-new-item',
  imports: [FormsModule],
  templateUrl: './new-item.html',
  styleUrl: './new-item.scss'
})
export class NewItem implements OnDestroy, AfterViewInit {

  //======= INJECTIONS =======

  protected readonly newItemService = inject(NewItemService);
  private readonly marsballCreateService = inject(MarsballCreateService);
  private readonly confirmationService = inject(ConfirmationDialogService);
  protected readonly cropService = inject(CropService);
  private readonly fileNameFormatter = inject(FileNameFormatterService);

  //======= VIEW CHILDREN =======

  @ViewChild('uploadZone') uploadZone?: ElementRef<HTMLDivElement>;
  @ViewChild('descriptionInput') descriptionInput?: ElementRef<HTMLTextAreaElement>;

  //======= TYPING EFFECT LOCAL =======

  private _dialogTitle = signal('');
  private _showCursor = signal(true);
  private _typingComplete = signal(false);
  private typingInterval: number | undefined;

  headerTitle = this._dialogTitle.asReadonly();
  showCursor = this._showCursor.asReadonly();
  typing = this._typingComplete.asReadonly();

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
    const { x, y, size } = this.cropService.crop();
    return {
      left: `${x}px`,
      top: `${y}px`,
      width: `${size}px`,
      height: `${size}px`
    };
  });

  thumbnailPreview = computed(() => {
    const img = this.mainImage();
    const { x, y, size } = this.cropService.crop();
    if (!img) return null;
    
    return {
      backgroundImage: `url(${img.preview})`,
      backgroundPosition: `-${x}px -${y}px`,
      backgroundSize: 'auto'
    };
  });

  //======= EFFECTS =======

  private readonly visibilityEffect = effect(() => {
    if (this.newItemService.isVisible()) {
      this.startTyping('Nouvel Item');
      setTimeout(() => this.focusUploadZone(), 200);
    } else {
      this.stopTyping();
    }
  });

  //======= TYPING EFFECT METHODS =======

  private startTyping(text: string): void {
    this.stopTyping();
    
    this._dialogTitle.set('');
    this._typingComplete.set(false);
    this._showCursor.set(true);
    
    let currentIndex = 0;
    const speed = 150;

    this.typingInterval = window.setInterval(() => {
      if (currentIndex < text.length) {
        this._dialogTitle.set(text.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        this.stopTyping();
        this._typingComplete.set(true);
      }
    }, speed);
  }

  private stopTyping(): void {
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
      this.typingInterval = undefined;
    }
  }

  //======= FOCUS MANAGEMENT =======

  private focusUploadZone(): void {
    if (this.uploadZone?.nativeElement) {
      this.uploadZone.nativeElement.focus();
      this.uploadZone.nativeElement.classList.add('focused');
    }
  }

  blurUploadZone(): void {
    if (this.uploadZone?.nativeElement) {
      this.uploadZone.nativeElement.classList.remove('focused');
    }
  }

  //======= LIFECYCLE =======

  ngAfterViewInit(): void {
    if (this.newItemService.isVisible()) {
      setTimeout(() => this.focusUploadZone(), 50);
    }
  }

  ngOnDestroy(): void {
    this.cleanupImages();
    this.stopTyping();
  }

  //======= PASTE LISTENER =======

  @HostListener('window:paste', ['$event'])
  onGlobalPaste(event: ClipboardEvent): void {
    if (!this.newItemService.isVisible()) return;

    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          if (!this.mainImage()) {
            this.setMainImage(file);
          } else if (this.itemDescription().trim().length === 0) {
            this.setDescriptionImage(file);
          }
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
    const files = event.dataTransfer?.files;
    if (files && files[0]) {
      this.setMainImage(files[0]);
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

  //======= FORM ACTIONS =======

  async createItem(): Promise<void> {
    if (!this.canCreate()) return;

    const categoryId = this.newItemService.contextCategoryId();
    const img = this.mainImage();
    
    if (categoryId === null || !img) return;

    const container = document.querySelector('.image-preview-container') as HTMLElement;
    
    if (!container) {
      console.error('Container image non trouvé');
      return;
    }

    const crop = this.cropService.crop();
    const description = this.itemDescription().trim();
    const displayWidth = container.clientWidth;
    const displayHeight = container.clientHeight;

    console.log('Dimensions container:', displayWidth, 'x', displayHeight);
    console.log('Crop:', crop);

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
    } catch (error) {
      console.error('Erreur création:', error);
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