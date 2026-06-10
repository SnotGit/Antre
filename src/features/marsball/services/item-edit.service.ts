import { Service, signal } from '@angular/core';

@Service()
export class ItemEditService {

  //======= SIGNALS =======

  private editingEntryId = signal<number | null>(null);
  private creatingSignal = signal(false);
  private entryTitle = signal('');
  private entryDescription = signal('');
  private originalImage = signal<string>('');
  private originalImageFile = signal<File | null>(null);
  private hasImageChanged = signal(false);

  //======= READONLY =======

  isEditing = this.editingEntryId.asReadonly();
  creating = this.creatingSignal.asReadonly();
  title = this.entryTitle.asReadonly();
  description = this.entryDescription.asReadonly();
  image = this.originalImage.asReadonly();
  imageFile = this.originalImageFile.asReadonly();
  imageChanged = this.hasImageChanged.asReadonly();

  //======= ACTIONS =======

  startCreate(): void {
    this.cleanup();
    this.creatingSignal.set(true);
  }

  startEdit(entryId: number, title: string, description: string, imageUrl: string): void {
    this.editingEntryId.set(entryId);
    this.entryTitle.set(title);
    this.entryDescription.set(description || '');
    this.originalImage.set(imageUrl);
    this.originalImageFile.set(null);
    this.hasImageChanged.set(false);
  }

  cancelEdit(): void {
    this.cleanup();
  }

  updateTitle(title: string): void {
    this.entryTitle.set(title);
  }

  updateDescription(description: string): void {
    this.entryDescription.set(description);
  }

  updateImage(file: File): void {
    if (this.originalImageFile()) {
      URL.revokeObjectURL(this.originalImage());
    }
    this.originalImageFile.set(file);
    this.originalImage.set(URL.createObjectURL(file));
    this.hasImageChanged.set(true);
  }

  isEditingEntry(entryId: number): boolean {
    return this.editingEntryId() === entryId;
  }

  //======= CLEANUP =======

  private cleanup(): void {
    if (this.hasImageChanged() && this.originalImageFile()) {
      URL.revokeObjectURL(this.originalImage());
    }
    this.editingEntryId.set(null);
    this.creatingSignal.set(false);
    this.entryTitle.set('');
    this.entryDescription.set('');
    this.originalImage.set('');
    this.originalImageFile.set(null);
    this.hasImageChanged.set(false);
  }
}
