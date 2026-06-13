import { Service, signal } from '@angular/core';

@Service()
export class TerraformarsFeedbackService {

  //========== SIGNALS ==========//

  private readonly _kind = signal<'idle' | 'success' | 'error'>('idle');
  private readonly _text = signal('');

  readonly kind = this._kind.asReadonly();
  readonly text = this._text.asReadonly();

  private timer: ReturnType<typeof setTimeout> | undefined;

  //========== METHODS ==========//

  show(kind: 'success' | 'error', text: string): void {
    clearTimeout(this.timer);
    this._kind.set(kind);
    this._text.set(text);
    this.timer = setTimeout(() => this._kind.set('idle'), 2500);
  }
}
