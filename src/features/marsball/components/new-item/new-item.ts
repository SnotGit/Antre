import { Component, OnDestroy, inject, signal, computed, effect, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NewItemService } from '@features/marsball/services/new-item.service';
import { MarsballCreateService } from '@features/marsball/services/marsball-create.service';
import { ConfirmationDialogService } from '@features/marsball/services/confirmation-dialog.service';
import { TypingEffectService } from '@shared/utilities/typing-effect/typing-effect.service';

interface ImageFile {
  file: File;
  preview: string;
}

interface CropData {
  x: number;
  y: number;
  size: number;
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
  private readonly typingService = inject(TypingEffectService);

  //======= VIEW CHILDREN =======

  @ViewChild('titleInput') titleInput?: ElementRef<HTMLInputElement>;
  @ViewChild('descriptionInput') descriptionInput?: ElementRef<HTMLTextAreaElement>;

  //======= TYPING EFFECT =======

  headerTitle = this.typingService.headerTitle;
  typing = this.typingService.typingComplete;

  //======= SIGNALS =======

  itemTitle = signal('');
  itemDescription = signal('');
  mainImage = signal<ImageFile | null>(null);
  descriptionImage = signal<ImageFile | null>(null);
  
  crop = signal<CropData>({ x: 0, y: 0, size: 60 });
  isDragging = signal(false);

  //======= COMPUTED =======

  canCreate = computed(() => {
    return this.itemTitle().trim().length > 0 && this.mainImage() !== null;
  });

  cropStyle = computed(() => {
    const { x, y, size } = this.crop();
    return {
      left: `${x}px`,
      top: `${y}px`,
      width: `${size}px`,
      height: `${size}px`
    };
  });

  thumbnailPreview = computed(() => {
    const img = this.mainImage();
    const { x, y, size } = this.crop();
    if (!img) return null;
    
    return {
      backgroundImage: `url(${img.preview})`,
      backgroundPosition: `-${x}px -${y}px`,
      backgroundSize: 'auto'
    };
  });

  //======= EFFECTS =======

  private readonly autoFocusEffect = effect(() => {
    if (this.newItemService.isVisible() && this.titleInput) {
      setTimeout(() => this.titleInput?.nativeElement.focus(), 100);
    }
  });

  //======= LIFECYCLE =======

  ngAfterViewInit(): void {
    if (this.newItemService.isVisible()) {
      this.titleInput?.nativeElement.focus();
    }
  }

  ngOnDestroy(): void {
    this.cleanupImages();
    this.typingService.destroy();
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
            setTimeout(() => this.descriptionInput?.nativeElement.focus(), 50);
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
    this.crop.set({ x: 0, y: 0, size: 60 });
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

  //======= CROP MANAGEMENT =======

  startDrag(event: MouseEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onMouseMove(event: MouseEvent, container: HTMLElement): void {
    if (!this.isDragging()) return;

    const rect = container.getBoundingClientRect();
    const currentCrop = this.crop();
    
    let newX = event.clientX - rect.left - currentCrop.size / 2;
    let newY = event.clientY - rect.top - currentCrop.size / 2;

    newX = Math.max(0, Math.min(newX, rect.width - currentCrop.size));
    newY = Math.max(0, Math.min(newY, rect.height - currentCrop.size));

    this.crop.set({ ...currentCrop, x: newX, y: newY });
  }

  stopDrag(): void {
    this.isDragging.set(false);
  }

  //======= FORM ACTIONS =======

  async createItem(): Promise<void> {
    if (!this.canCreate()) return;

    const categoryId = this.newItemService.contextCategoryId();
    const img = this.mainImage();
    if (categoryId === null || !img) return;

    try {
      await this.marsballCreateService.createItem(
        this.itemTitle().trim(),
        categoryId,
        img.file
      );

      this.confirmationService.showSuccessMessage();
      this.resetForm();
      this.newItemService.close();
      
      window.location.reload();
    } catch (error) {
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