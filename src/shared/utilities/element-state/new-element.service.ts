import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NewElementService {

  //======= INJECTIONS =======

  private readonly router = inject(Router);

  //======= SIGNALS =======

  private visible = signal(false);
  private categoryId = signal<number | null>(null);
  private resolvePromise: (() => void) | null = null;

  isVisible = this.visible.asReadonly();
  contextCategoryId = this.categoryId.asReadonly();

  //======= SHOW =======

  show(): Promise<void> {
    const id = this.detectCategoryId();
    this.categoryId.set(id);
    this.visible.set(true);

    return new Promise<void>((resolve) => {
      this.resolvePromise = resolve;
    });
  }

  //======= CLOSE =======

  close(): void {
    this.visible.set(false);
    this.categoryId.set(null);
    
    if (this.resolvePromise) {
      this.resolvePromise();
      this.resolvePromise = null;
    }
  }

  //======= DETECT CATEGORY ID =======

  private detectCategoryId(): number | null {
    const url = this.router.url;
    const matches = url.match(/\/(\d+)/g);
    
    if (!matches || matches.length === 0) return null;
    
    const lastMatch = matches[matches.length - 1];
    return parseInt(lastMatch.replace('/', ''), 10);
  }
}