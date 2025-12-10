import { Injectable, signal } from '@angular/core';

interface CropBox {
  x: number;
  y: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class EditBestiaireCreatureService {

  //======= SIGNALS =======

  private editingCreatureId = signal<number | null>(null);
  private creatureTitle = signal('');
  private creatureDescription = signal('');
  private originalImage = signal<string>('');
  private originalImageFile = signal<File | null>(null);
  private hasImageChanged = signal(false);
  private cropBox = signal<CropBox>({ x: 20, y: 20, size: 200 });
  private isDragging = signal(false);
  private dragOffset = signal({ x: 0, y: 0 });

  //======= READONLY =======

  isEditing = this.editingCreatureId.asReadonly();
  title = this.creatureTitle.asReadonly();
  description = this.creatureDescription.asReadonly();
  image = this.originalImage.asReadonly();
  imageFile = this.originalImageFile.asReadonly();
  imageChanged = this.hasImageChanged.asReadonly();
  crop = this.cropBox.asReadonly();

  //======= ACTIONS =======

  startEdit(creatureId: number, title: string, description: string, imageUrl: string): void {
    this.editingCreatureId.set(creatureId);
    this.creatureTitle.set(title);
    this.creatureDescription.set(description || '');
    this.originalImage.set(imageUrl);
    this.originalImageFile.set(null);
    this.hasImageChanged.set(false);
    this.cropBox.set({ x: 20, y: 20, size: 200 });
  }

  cancelEdit(): void {
    this.cleanup();
  }

  updateTitle(title: string): void {
    this.creatureTitle.set(title);
  }

  updateDescription(description: string): void {
    this.creatureDescription.set(description);
  }

  updateImage(file: File): void {
    if (this.originalImageFile()) {
      URL.revokeObjectURL(this.originalImage());
    }
    this.originalImageFile.set(file);
    this.originalImage.set(URL.createObjectURL(file));
    this.hasImageChanged.set(true);
    this.cropBox.set({ x: 20, y: 20, size: 200 });
  }

  isEditingCreature(creatureId: number): boolean {
    return this.editingCreatureId() === creatureId;
  }

  //======= DRAG & DROP =======

  startDrag(event: MouseEvent, containerRect: DOMRect): void {
    event.preventDefault();
    const crop = this.cropBox();
    this.isDragging.set(true);
    this.dragOffset.set({
      x: event.clientX - containerRect.left - crop.x,
      y: event.clientY - containerRect.top - crop.y
    });
  }

  onDrag(event: MouseEvent, containerRect: DOMRect): void {
    if (!this.isDragging()) return;

    const offset = this.dragOffset();
    const crop = this.cropBox();
    
    let newX = event.clientX - containerRect.left - offset.x;
    let newY = event.clientY - containerRect.top - offset.y;

    newX = Math.max(0, Math.min(newX, containerRect.width - crop.size));
    newY = Math.max(0, Math.min(newY, containerRect.height - crop.size));

    this.cropBox.set({ ...crop, x: newX, y: newY });
  }

  stopDrag(): void {
    this.isDragging.set(false);
  }

  //======= CLEANUP =======

  private cleanup(): void {
    if (this.hasImageChanged() && this.originalImageFile()) {
      URL.revokeObjectURL(this.originalImage());
    }
    this.editingCreatureId.set(null);
    this.creatureTitle.set('');
    this.creatureDescription.set('');
    this.originalImage.set('');
    this.originalImageFile.set(null);
    this.hasImageChanged.set(false);
    this.cropBox.set({ x: 20, y: 20, size: 200 });
    this.isDragging.set(false);
    this.dragOffset.set({ x: 0, y: 0 });
  }
}
