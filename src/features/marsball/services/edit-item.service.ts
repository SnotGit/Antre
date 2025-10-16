import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';

interface CropBox {
  x: number;
  y: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class EditItemService {

  //======= INJECTIONS =======

  private readonly router = inject(Router);

  //======= SIGNALS =======

  private editingItemId = signal<number | null>(null);
  private itemTitle = signal('');
  private itemDescription = signal('');
  private originalImage = signal<string>('');
  private cropBox = signal<CropBox>({ x: 0, y: 0, size: 150 });
  private isDragging = signal(false);
  private dragOffset = signal({ x: 0, y: 0 });

  //======= READONLY =======

  isEditing = this.editingItemId.asReadonly();
  title = this.itemTitle.asReadonly();
  description = this.itemDescription.asReadonly();
  image = this.originalImage.asReadonly();
  crop = this.cropBox.asReadonly();

  //======= ACTIONS =======

  startEdit(itemId: number, title: string, description: string, imageUrl: string): void {
    this.editingItemId.set(itemId);
    this.itemTitle.set(title);
    this.itemDescription.set(description || '');
    this.originalImage.set(imageUrl);
    this.cropBox.set({ x: 0, y: 0, size: 80 });
  }

  cancelEdit(): void {
    this.cleanup();
  }

  updateTitle(title: string): void {
    this.itemTitle.set(title);
  }

  updateDescription(description: string): void {
    this.itemDescription.set(description);
  }

  isEditingItem(itemId: number): boolean {
    return this.editingItemId() === itemId;
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
    this.editingItemId.set(null);
    this.itemTitle.set('');
    this.itemDescription.set('');
    this.originalImage.set('');
    this.cropBox.set({ x: 0, y: 0, size: 150 });
    this.isDragging.set(false);
    this.dragOffset.set({ x: 0, y: 0 });
  }
}