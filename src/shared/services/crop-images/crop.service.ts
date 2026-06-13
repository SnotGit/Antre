import { Service, signal } from '@angular/core';

//======= INTERFACES =======

interface CropState {
  x: number;
  y: number;
  size: number;
  aspect: number;
}

//======= SERVICE =======

@Service()
export class CropService {

  //======= SIGNALS PRIVÉS =======

  private _crop = signal<CropState>({ x: 0, y: 0, size: 60, aspect: 1 });

  //======= READONLY PUBLICS =======

  crop = this._crop.asReadonly();

  //======= INITIALISATION =======

  init(initialSize: number = 60): void {
    this._crop.set({ x: 0, y: 0, size: initialSize, aspect: 1 });
  }

  initWithPosition(initialSize: number, initialX: number, initialY: number, aspect: number = 1): void {
    this._crop.set({ x: initialX, y: initialY, size: initialSize, aspect });
  }

  reset(): void {
    this.init();
  }
}
