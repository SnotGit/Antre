import { Injectable, signal } from '@angular/core';

export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationDialogService {
  
  private _isVisible = signal<boolean>(false);
  private _config = signal<ConfirmationConfig | null>(null);
  private _resolvePromise: ((result: boolean) => void) | null = null;

  readonly isVisible = this._isVisible.asReadonly();
  readonly config = this._config.asReadonly();

  async confirm(config: ConfirmationConfig): Promise<boolean> {
    return new Promise((resolve) => {
      this._config.set({
        confirmText: 'Confirmer',
        cancelText: 'Annuler',
        isDanger: false,
        ...config
      });
      
      this._isVisible.set(true);
      this._resolvePromise = resolve;
    });
  }

  onConfirm(): void {
    this._isVisible.set(false);
    this._config.set(null);
    this._resolvePromise?.(true);
    this._resolvePromise = null;
  }

  onCancel(): void {
    this._isVisible.set(false);
    this._config.set(null);
    this._resolvePromise?.(false);
    this._resolvePromise = null;
  }
}