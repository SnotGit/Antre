import { Injectable, signal} from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class TypingEffectService {
  
  //============ SIGNALS ============
  
  private _headerTitle = signal<string>('');
  private _showCursor = signal<boolean>(true);
  private _typingComplete = signal<boolean>(false);
  
  //============ READONLY ============
  
  readonly headerTitle = this._headerTitle.asReadonly();
  readonly showCursor = this._showCursor.asReadonly();
  readonly typingComplete = this._typingComplete.asReadonly();
  
  //============ STATES ============
  
  private typingInterval: number | undefined;
  
  //============ METHODS ============
  
  title(title: string): void {
    this.destroy();
    
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
        this.destroy();
        this._typingComplete.set(true);
      }
    }, speed);
  }
  
  //============ CLEANUP ============
  
  public destroy(): void {
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
      this.typingInterval = undefined;
    }
  }
}