import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TypingEffectService {

  //============ SIGNALS PRIVÉS ============

  private _headerTitle = signal<string>('');
  private _showCursor = signal<boolean>(true);
  private _typingComplete = signal<boolean>(false);

  //============ SIGNALS PUBLICS ============

  readonly headerTitle = this._headerTitle.asReadonly();
  readonly showCursor = this._showCursor.asReadonly();
  readonly typingComplete = this._typingComplete.asReadonly();

  //============ ÉTAT INTERNE ============

  private typingInterval: number | undefined;

  //============ MÉTHODE PRINCIPALE ============

  title(title: string): void {
    this.cleanup();
    
    this._headerTitle.set('');
    this._typingComplete.set(false);
    this._showCursor.set(true);
    
    let currentIndex = 0;
    const speed = 150;

    this.typingInterval = window.setInterval(() => {
      if (currentIndex < title.length) {
        this._headerTitle.set(title.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        this.cleanup();
        this._typingComplete.set(true);
      }
    }, speed);
  }

  //============ NETTOYAGE ============

  private cleanup(): void {
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
      this.typingInterval = undefined;
    }
  }
}