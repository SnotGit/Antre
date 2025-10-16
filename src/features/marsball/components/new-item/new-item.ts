import { Component, OnDestroy, inject, signal, computed, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NewItemService } from '@features/marsball/services/new-item.service';
import { MarsballCreateService } from '@features/marsball/services/marsball-create.service';
import { ConfirmationDialogService } from '@features/marsball/services/confirmation-dialog.service';
import { TypingEffectService } from '@shared/utilities/typing-effect/typing-effect.service';

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
export class NewItem implements OnDestroy {

  //======= INJECTIONS =======

  protected readonly newItemService = inject(NewItemService);
  private readonly marsballCreateService = inject(MarsballCreateService);
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly typingService = inject(TypingEffectService);

  //======= TYPING EFFECT =======

  headerTitle = this.typingService.headerTitle;
  typing = this.typingService.typingComplete;

  //======= SIGNALS =======

  itemTitle = signal('');
  itemDescription = signal('');
  image = signal<ImageFile | null>(null);

  //======= COMPUTED =======

  canCreate = computed(() => {
    return this.itemTitle().trim().length > 0 && this.image() !== null;
  });

  //======= LIFECYCLE =======

  ngOnDestroy(): void {
    const img = this.image();
    if (img) {
      URL.revokeObjectURL(img.preview);
    }
    this.typingService.destroy();
  }

  //======= PASTE LISTENER =======

  @HostListener('window:paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    if (!this.newItemService.isVisible()) return;

    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          this.setImage(file);
          break;
        }
      }
    }
  }

  //======= UPLOAD ACTIONS =======

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.setImage(input.files[0]);
      input.value = '';
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files[0]) {
      this.setImage(files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private setImage(file: File): void {
    const oldImage = this.image();
    if (oldImage) {
      URL.revokeObjectURL(oldImage.preview);
    }

    const preview = URL.createObjectURL(file);
    this.image.set({ file, preview });
  }

  //======= IMAGE MANAGEMENT =======

  removeImage(): void {
    const img = this.image();
    if (img) {
      URL.revokeObjectURL(img.preview);
      this.image.set(null);
    }
  }

  //======= FORM ACTIONS =======

  async createItem(): Promise<void> {
    if (!this.canCreate()) return;

    const categoryId = this.newItemService.contextCategoryId();
    const img = this.image();
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

  private resetForm(): void {
    const img = this.image();
    if (img) {
      URL.revokeObjectURL(img.preview);
    }
    
    this.itemTitle.set('');
    this.itemDescription.set('');
    this.image.set(null);
  }
}