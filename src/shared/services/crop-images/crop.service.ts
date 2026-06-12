import { Service, signal } from '@angular/core';

//======= INTERFACES =======

interface CropState {
  x: number;
  y: number;
  size: number;
  aspect: number;
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

@Service()
export class CropService {

  //======= SIGNALS PRIVÉS =======

  private _crop = signal<CropState>({ x: 0, y: 0, size: 60, aspect: 1 });
  private _isCtrlPressed = signal(false);
  private _isDragging = signal(false);
  private _currentDragMode = signal<DragMode>(DragMode.NONE);
  private _dragStart = signal<DragStart | null>(null);

  //======= READONLY PUBLICS =======

  crop = this._crop.asReadonly();
  isCtrlPressed = this._isCtrlPressed.asReadonly();
  isDragging = this._isDragging.asReadonly();
  currentDragMode = this._currentDragMode.asReadonly();

  //======= KEYBOARD LISTENERS =======

  private readonly _keyListeners = (() => {
    window.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.ctrlKey && !this._isCtrlPressed()) {
        this._isCtrlPressed.set(true);
      }
    });

    window.addEventListener('keyup', (event: KeyboardEvent) => {
      if (!event.ctrlKey && this._isCtrlPressed()) {
        this._isCtrlPressed.set(false);
        if (!this._isDragging()) {
          this._currentDragMode.set(DragMode.NONE);
        }
      }
    });
  })();

  //======= INITIALISATION =======

  init(initialSize: number = 60): void {
    this._crop.set({ x: 0, y: 0, size: initialSize, aspect: 1 });
    this._currentDragMode.set(DragMode.NONE);
    this._isDragging.set(false);
    this._dragStart.set(null);
  }

  initWithPosition(initialSize: number, initialX: number, initialY: number, aspect: number = 1): void {
    this._crop.set({ x: initialX, y: initialY, size: initialSize, aspect });
    this._currentDragMode.set(DragMode.NONE);
    this._isDragging.set(false);
    this._dragStart.set(null);
  }

  cropHeight(): number {
    const crop = this._crop();
    return crop.size / crop.aspect;
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
    const height = currentCrop.size / currentCrop.aspect;

    let newX = event.clientX - rect.left - currentCrop.size / 2;
    let newY = event.clientY - rect.top - height / 2;

    newX = Math.max(0, Math.min(newX, rect.width - currentCrop.size));
    newY = Math.max(0, Math.min(newY, rect.height - height));

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

    const aspect = this._crop().aspect;
    const deltaX = event.clientX - rect.left - start.mouseX;
    const deltaY = event.clientY - rect.top - start.mouseY;
    const delta = (deltaX + deltaY) / 2;

    let newSize = start.cropSize - delta;
    newSize = Math.max(40, newSize);
    newSize = Math.min(newSize, Math.min(rect.width, rect.height * aspect));

    let newX = Math.max(0, start.cropX + (start.cropSize - newSize));
    let newY = Math.max(0, start.cropY + (start.cropSize - newSize) / aspect);

    if (newX + newSize > rect.width) {
      newSize = rect.width - newX;
    }
    if (newY + newSize / aspect > rect.height) {
      newSize = (rect.height - newY) * aspect;
    }

    this._crop.set({ x: newX, y: newY, size: newSize, aspect });
  }

  private handleResizeTR(event: MouseEvent, rect: DOMRect): void {
    const start = this._dragStart();
    if (!start) return;

    const aspect = this._crop().aspect;
    const deltaX = event.clientX - rect.left - start.mouseX;
    const deltaY = event.clientY - rect.top - start.mouseY;
    const delta = (deltaX - deltaY) / 2;

    let newSize = start.cropSize + delta;
    newSize = Math.max(40, newSize);

    let newY = Math.max(0, start.cropY - (newSize - start.cropSize) / aspect);

    if (start.cropX + newSize > rect.width) {
      newSize = rect.width - start.cropX;
    }
    if (newY + newSize / aspect > rect.height) {
      newSize = (rect.height - newY) * aspect;
    }

    this._crop.set({ x: start.cropX, y: newY, size: newSize, aspect });
  }

  private handleResizeBL(event: MouseEvent, rect: DOMRect): void {
    const start = this._dragStart();
    if (!start) return;

    const aspect = this._crop().aspect;
    const deltaX = event.clientX - rect.left - start.mouseX;
    const deltaY = event.clientY - rect.top - start.mouseY;
    const delta = (-deltaX + deltaY) / 2;

    let newSize = start.cropSize + delta;
    newSize = Math.max(40, newSize);

    let newX = Math.max(0, start.cropX - (newSize - start.cropSize));

    if (newX + newSize > rect.width) {
      newSize = rect.width - newX;
    }
    if (start.cropY + newSize / aspect > rect.height) {
      newSize = (rect.height - start.cropY) * aspect;
    }

    this._crop.set({ x: newX, y: start.cropY, size: newSize, aspect });
  }

  private handleResizeBR(event: MouseEvent, rect: DOMRect): void {
    const start = this._dragStart();
    if (!start) return;

    const aspect = this._crop().aspect;
    const deltaX = event.clientX - rect.left - start.mouseX;
    const deltaY = event.clientY - rect.top - start.mouseY;
    const delta = (deltaX + deltaY) / 2;

    let newSize = start.cropSize + delta;
    newSize = Math.max(40, newSize);

    if (start.cropX + newSize > rect.width) {
      newSize = rect.width - start.cropX;
    }
    if (start.cropY + newSize / aspect > rect.height) {
      newSize = (rect.height - start.cropY) * aspect;
    }

    this._crop.set({ x: start.cropX, y: start.cropY, size: newSize, aspect });
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