import { Injectable, inject, signal } from '@angular/core';
import { TypingEffectService } from '@shared/services/typing-effect/typing-effect.service';

@Injectable({
  providedIn: 'root'
})
export class TitleService {

  //======= INJECTIONS =======

  private readonly typingService = inject(TypingEffectService);

  //======= SIGNALS =======

  private _overrideTitle = signal<string | null>(null);
  readonly overrideTitle = this._overrideTitle.asReadonly();

  readonly headerTitle = this.typingService.headerTitle;
  readonly showCursor = this.typingService.showCursor;
  readonly typingComplete = this.typingService.typingComplete;

  //======= METHODS =======

  setOverrideTitle(title: string | null): void {
    this._overrideTitle.set(title);
  }

  setTitle(title: string): void {
    this.typingService.title(title);
  }

  destroy(): void {
    this.typingService.destroy();
  }
}