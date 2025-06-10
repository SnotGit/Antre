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
    const isComplete = signal<boolean>(false);
    
    let typingInterval: number | undefined;

    const startTyping = () => {
      let currentIndex = 0;
      const speed = config.speed || 150;

      typingInterval = window.setInterval(() => {
        if (currentIndex < config.text.length) {
          displayedText.set(config.text.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          // Arrêt du typing
          clearInterval(typingInterval);
          
          // 3 blinks puis cache le curseur
          setTimeout(() => {
            showCursor.set(false);
            isComplete.set(true);
          }, (config.finalBlinks || 3) * 1000);
        }
      }, speed);
    };

    const cleanup = () => {
      if (typingInterval) {
        clearInterval(typingInterval as number);
      }
    };

    return {
      displayedTitle: displayedText.asReadonly(),
      showCursor: showCursor.asReadonly(),
      isComplete: isComplete.asReadonly(),
      startTyping,
      cleanup
    };
  }
}