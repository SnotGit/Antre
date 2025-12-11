import { Injectable, signal, inject, computed } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NewBestiaireCreatureService {

  //======= INJECTIONS =======

  private readonly router = inject(Router);

  //======= SIGNALS =======

  private visible = signal(false);
  private categoryId = signal<number | null>(null);
  private resolvePromise: (() => void) | null = null;

  isVisible = this.visible.asReadonly();
  contextCategoryId = this.categoryId.asReadonly();

  //======= COMPUTED =======

  private readonly currentUrl = computed(() => this.router.url);

  private readonly urlMatches = computed(() => {
    const url = this.currentUrl();
    return url.match(/\/(\d+)/g);
  });

  private readonly detectedCategoryId = computed(() => {
    const matches = this.urlMatches();
    if (!matches || matches.length === 0) return null;

    const lastMatch = matches[matches.length - 1];
    return parseInt(lastMatch.replace('/', ''), 10);
  });

  //======= SHOW =======

  show(): Promise<void> {
    this.categoryId.set(this.detectedCategoryId());
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
}
