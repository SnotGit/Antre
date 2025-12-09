import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NewCategoryService {

  //======= INJECTIONS =======

  private readonly router = inject(Router);

  //======= SIGNALS =======

  private visible = signal(false);
  private parentId = signal<number | null>(null);
  private resolvePromise: (() => void) | null = null;

  isVisible = this.visible.asReadonly();
  contextParentId = this.parentId.asReadonly();

  //======= SHOW DIALOG =======

  show(): Promise<void> {
    const parentId = this.detectParentId();
    this.parentId.set(parentId);
    this.visible.set(true);

    return new Promise<void>((resolve) => {
      this.resolvePromise = resolve;
    });
  }

  //======= CLOSE DIALOG =======

  close(): void {
    this.visible.set(false);
    this.parentId.set(null);
    
    if (this.resolvePromise) {
      this.resolvePromise();
      this.resolvePromise = null;
    }
  }

  //======= DETECT CONTEXT =======

  private detectParentId(): number | null {
    const url = this.router.url;
    const match = url.match(/\/marsball\/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }
}