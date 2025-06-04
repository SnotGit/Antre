import { Injectable, signal } from '@angular/core';

export interface TypingConfig {
  text: string;
  speed?: number;
  cursorColor: string; 
  showCursor?: boolean;
  finalBlinks?: number;
  onComplete?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class TypingEffectService {

  createTypingEffect(config: TypingConfig) {
    const displayedText = signal<string>('');
    const isComplete = signal<boolean>(false);
    const showCursor = signal<boolean>(true);
    
    let typingInterval: number | undefined;
    let cursorInterval: number | undefined;
    let finalBlinkInterval: number | undefined;

    const startTyping = () => {
      let currentIndex = 0;
      const speed = config.speed || 200;

      if (config.showCursor !== false) {
        cursorInterval = window.setInterval(() => {
          showCursor.set(!showCursor());
        }, 500);
      }

      typingInterval = window.setInterval(() => {
        if (currentIndex < config.text.length) {
          displayedText.set(config.text.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          if (typingInterval) {
            clearInterval(typingInterval);
          }
          if (cursorInterval) {
            clearInterval(cursorInterval);
          }
          
          const finalBlinks = config.finalBlinks || 3;
          let blinkCount = 0;
          showCursor.set(true);
          
          finalBlinkInterval = window.setInterval(() => {
            showCursor.set(!showCursor());
            blinkCount++;
            
            if (blinkCount >= finalBlinks * 2) {
              if (finalBlinkInterval) {
                clearInterval(finalBlinkInterval);
              }
              showCursor.set(false);
              isComplete.set(true);
              config.onComplete?.();
            }
          }, 500);
        }
      }, speed);
    };

    const cleanup = () => {
      if (typingInterval) {
        clearInterval(typingInterval);
      }
      if (cursorInterval) {
        clearInterval(cursorInterval);
      }
      if (finalBlinkInterval) {
        clearInterval(finalBlinkInterval);
      }
    };

    const getCursorClass = () => {
      const color = config.cursorColor;
      return `cursor-${color.replace('#', '')}`;
    };

    return {
      displayedTitle: displayedText.asReadonly(),
      isComplete: isComplete.asReadonly(),
      showCursor: showCursor.asReadonly(),
      startTyping,
      cleanup,
      getCursorClass
    };
  }
}