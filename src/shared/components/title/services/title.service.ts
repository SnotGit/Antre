import { Injectable, inject } from '@angular/core';
import { TypingEffectService } from '@shared/services/typing-effect/typing-effect.service';

@Injectable({
  providedIn: 'root'
})
export class TitleService {

  //======= INJECTIONS =======

  private readonly typingService = inject(TypingEffectService);

  //======= SIGNALS =======

  readonly headerTitle = this.typingService.headerTitle;
  readonly showCursor = this.typingService.showCursor;
  readonly typingComplete = this.typingService.typingComplete;

  //======= METHODS =======

  setTitle(title: string): void {
    this.typingService.title(title);
  }

  destroy(): void {
    this.typingService.destroy();
  }
}