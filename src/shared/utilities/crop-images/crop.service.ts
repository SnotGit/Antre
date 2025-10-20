import { Injectable, signal, HostListener } from '@angular/core';

//======= INTERFACES =======

interface CropState {
  x: number;
  y: number;
  size: number;
}

enum DragMode {
  NONE = 'none',
  MOVE = 'move',
  RESIZE_TL = 'resize-tl',
  RESIZE_TR = 'resize-tr',
  RESIZE_BL = 'resize-bl',
  RESIZE_BR = 'resize-br'
}

interface DragStart {
  mouseX: number;
  mouseY: number;
  cropX: number;
  cropY: number;
  cropSize: number;
}

//======= SERVICE =======

@Injectable({
  providedIn: 'root'
})
export class CropService {

  //======= SIGNALS PRIVÉS =======

  private _crop = signal<CropState>({ x: 0, y: 0, size: 60 });
  private _isCtrlPressed = signal(false);
  private _isDragging = signal(false);
  private _currentDragMode = signal<DragMode>(DragMode.NONE);
  private _dragStart = signal<DragStart | null>(null);

  //======= READONLY PUBLICS =======

  crop = this._crop.asReadonly();
  isCtrlPressed = this._isCtrlPressed.asReadonly();
  isDragging = this._isDragging.asReadonly();
  currentDragMode = this._currentDragMode.asReadonly();

  //======= HOST LISTENERS =======

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey && !this._isCtrlPressed()) {
      this._isCtrlPressed.set(true);
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    if (!event.ctrlKey && this._isCtrlPressed()) {
      this._isCtrlPressed.set(false);
      this._currentDragMode.set(DragMode.NONE);
    }
  }

  //======= INITIALISATION =======

  init(initialSize: number = 60): void {
    this._crop.set({ x: 0, y: 0, size: initialSize });
    this._currentDragMode.set(DragMode.NONE);
    this._isDragging.set(false);
    this._dragStart.set(null);
  }

  reset(): void {
    this.init();
  }

  //======= DÉPLACEMENT =======

  startMove(event: MouseEvent, containerRect: DOMRect): void {
    if (this._isCtrlPressed()) return;

    event.preventDefault();
    const currentCrop = this._crop();
    
    this._dragStart.set({
      mouseX: event.clientX - containerRect.left,
      mouseY: event.clientY - containerRect.top,
      cropX: currentCrop.x,
      cropY: currentCrop.y,
      cropSize: currentCrop.size
    });

    this._currentDragMode.set(DragMode.MOVE);
    this._isDragging.set(true);
  }

  private handleMove(event: MouseEvent, rect: DOMRect): void {
    const start = this._dragStart();
    if (!start) return;

    const currentCrop = this._crop();
    
    let newX = event.clientX - rect.left - currentCrop.size / 2;
    let newY = event.clientY - rect.top - currentCrop.size / 2;

    newX = Math.max(0, Math.min(newX, rect.width - currentCrop.size));
    newY = Math.max(0, Math.min(newY, rect.height - currentCrop.size));

    this._crop.set({ ...currentCrop, x: newX, y: newY });
  }

  //======= RESIZE =======

  startResize(event: MouseEvent, corner: 'tl' | 'tr' | 'bl' | 'br', containerRect: DOMRect): void {
    if (!this._isCtrlPressed()) return;

    event.preventDefault();
    event.stopPropagation();

    const currentCrop = this._crop();
    
    this._dragStart.set({
      mouseX: event.clientX - containerRect.left,
      mouseY: event.clientY - containerRect.top,
      cropX: currentCrop.x,
      cropY: currentCrop.y,
      cropSize: currentCrop.size
    });

    const modeMap = {
      'tl': DragMode.RESIZE_TL,
      'tr': DragMode.RESIZE_TR,
      'bl': DragMode.RESIZE_BL,
      'br': DragMode.RESIZE_BR
    };

    this._currentDragMode.set(modeMap[corner]);
    this._isDragging.set(true);
  }

  private handleResizeTL(event: MouseEvent, rect: DOMRect): void {
    const start = this._dragStart();
    if (!start) return;
    
    const deltaX = event.clientX - rect.left - start.mouseX;
    const deltaY = event.clientY - rect.top - start.mouseY;
    const delta = (deltaX + deltaY) / 2;
    
    let newSize = start.cropSize - delta;
    let newX = start.cropX + delta;
    let newY = start.cropY + delta;
    
    newSize = Math.max(40, newSize);
    newSize = Math.min(newSize, Math.min(rect.width, rect.height));
    
    newX = Math.max(0, newX);
    newY = Math.max(0, newY);
    
    if (newX + newSize > rect.width) {
      newSize = rect.width - newX;
    }
    if (newY + newSize > rect.height) {
      newSize = rect.height - newY;
    }
    
    this._crop.set({ x: newX, y: newY, size: newSize });
  }

  private handleResizeTR(event: MouseEvent, rect: DOMRect): void {
    const start = this._dragStart();
    if (!start) return;
    
    const deltaX = event.clientX - rect.left - start.mouseX;
    const deltaY = event.clientY - rect.top - start.mouseY;
    const delta = (deltaX - deltaY) / 2;
    
    let newSize = start.cropSize + delta;
    let newY = start.cropY - delta;
    
    newSize = Math.max(40, newSize);
    newY = Math.max(0, newY);
    
    if (start.cropX + newSize > rect.width) {
      newSize = rect.width - start.cropX;
    }
    if (newY + newSize > rect.height) {
      newSize = rect.height - newY;
    }
    
    this._crop.set({ x: start.cropX, y: newY, size: newSize });
  }

  private handleResizeBL(event: MouseEvent, rect: DOMRect): void {
    const start = this._dragStart();
    if (!start) return;
    
    const deltaX = event.clientX - rect.left - start.mouseX;
    const deltaY = event.clientY - rect.top - start.mouseY;
    const delta = (-deltaX + deltaY) / 2;
    
    let newSize = start.cropSize + delta;
    let newX = start.cropX - delta;
    
    newSize = Math.max(40, newSize);
    newX = Math.max(0, newX);
    
    if (newX + newSize > rect.width) {
      newSize = rect.width - newX;
    }
    if (start.cropY + newSize > rect.height) {
      newSize = rect.height - start.cropY;
    }
    
    this._crop.set({ x: newX, y: start.cropY, size: newSize });
  }

  private handleResizeBR(event: MouseEvent, rect: DOMRect): void {
    const start = this._dragStart();
    if (!start) return;
    
    const deltaX = event.clientX - rect.left - start.mouseX;
    const deltaY = event.clientY - rect.top - start.mouseY;
    const delta = (deltaX + deltaY) / 2;
    
    let newSize = start.cropSize + delta;
    
    newSize = Math.max(40, newSize);
    
    if (start.cropX + newSize > rect.width) {
      newSize = rect.width - start.cropX;
    }
    if (start.cropY + newSize > rect.height) {
      newSize = rect.height - start.cropY;
    }
    
    this._crop.set({ x: start.cropX, y: start.cropY, size: newSize });
  }

  //======= DRAG PRINCIPAL =======

  onDrag(event: MouseEvent, containerRect: DOMRect): void {
    if (!this._isDragging()) return;
    
    const mode = this._currentDragMode();
    
    switch (mode) {
      case DragMode.MOVE:
        this.handleMove(event, containerRect);
        break;
      case DragMode.RESIZE_TL:
        this.handleResizeTL(event, containerRect);
        break;
      case DragMode.RESIZE_TR:
        this.handleResizeTR(event, containerRect);
        break;
      case DragMode.RESIZE_BL:
        this.handleResizeBL(event, containerRect);
        break;
      case DragMode.RESIZE_BR:
        this.handleResizeBR(event, containerRect);
        break;
    }
  }

  stopDrag(): void {
    this._isDragging.set(false);
    this._currentDragMode.set(DragMode.NONE);
    this._dragStart.set(null);
  }
}