import { Injectable, signal } from '@angular/core';

export interface TypingConfig {
  text: string;
  speed?: number;
  finalBlinks?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TypingEffectService {

  createTypingEffect(config: TypingConfig) {
    const displayedText = signal<string>('');
    const showCursor = signal<boolean>(true);
    const typingComplete = signal<boolean>(false);
    
    let typingInterval: number | undefined;

    const startTyping = () => {
      let currentIndex = 0;
      const speed = config.speed || 150;

      typingInterval = window.setInterval(() => {
        if (currentIndex < config.text.length) {
          displayedText.set(config.text.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          typingComplete.set(true);
        }
      }, speed);
    };

    const cleanup = () => {
      if (typingInterval) {
        clearInterval(typingInterval);
      }
    };

    return {
      headerTitle: displayedText.asReadonly(),
      showCursor: showCursor.asReadonly(),
      typingComplete: typingComplete.asReadonly(),
      startTyping,
      cleanup
    };
  }
}