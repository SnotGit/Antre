import { Service, signal } from '@angular/core';

@Service()
export class TypingTextService {

  private _text = signal<string>('');
  private _complete = signal<boolean>(false);

  readonly text = this._text.asReadonly();
  readonly complete = this._complete.asReadonly();

  private interval: number | undefined;

  type(text: string, speed: number = 25): void {
    this.destroy();

    this._text.set('');
    this._complete.set(false);

    let i = 0;
    this.interval = window.setInterval(() => {
      if (i < text.length) {
        this._text.set(text.substring(0, i + 1));
        i++;
      } else {
        this.destroy();
        this._complete.set(true);
      }
    }, speed);
  }

  destroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }
}
