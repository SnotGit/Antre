import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TypingEffectService } from '@shared/utilities/typing-effect/typing-effect.service';

@Injectable({
  providedIn: 'root'
})
export class NewItemService {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly typingService = inject(TypingEffectService);

  //======= SIGNALS =======

  private visible = signal(false);
  private categoryId = signal<number | null>(null);
  private resolvePromise: (() => void) | null = null;

  isVisible = this.visible.asReadonly();
  contextCategoryId = this.categoryId.asReadonly();

  //======= SHOW DIALOG =======

  show(): Promise<void> {
    const categoryId = this.detectCategoryId();
    this.categoryId.set(categoryId);
    this.visible.set(true);
    this.typingService.title('Nouvel Item');

    return new Promise<void>((resolve) => {
      this.resolvePromise = resolve;
    });
  }

  //======= CLOSE DIALOG =======

  close(): void {
    this.visible.set(false);
    this.categoryId.set(null);
    
    if (this.resolvePromise) {
      this.resolvePromise();
      this.resolvePromise = null;
    }
  }

  //======= DETECT CONTEXT =======

  private detectCategoryId(): number | null {
    const url = this.router.url;
    const match = url.match(/\/marsball\/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }
}