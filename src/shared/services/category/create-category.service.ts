import { Injectable, signal, inject, computed } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class CreateCategoryService {

  //======= INJECTIONS =======

  private readonly router = inject(Router);

  //======= SIGNALS =======

  private visible = signal(false);
  private parentId = signal<number | null>(null);
  private resolvePromise: (() => void) | null = null;

  isVisible = this.visible.asReadonly();
  contextParentId = this.parentId.asReadonly();

  //======= COMPUTED =======

  private readonly currentUrl = computed(() => this.router.url);

  private readonly urlMatches = computed(() => {
    const url = this.currentUrl();
    return url.match(/\/(\d+)/g);
  });

  private readonly detectedParentId = computed(() => {
    const matches = this.urlMatches();
    if (!matches || matches.length === 0) return null;

    const lastMatch = matches[matches.length - 1];
    return parseInt(lastMatch.replace('/', ''), 10);
  });

  //======= SHOW DIALOG =======

  show(): Promise<void> {
    this.parentId.set(this.detectedParentId());
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
}
