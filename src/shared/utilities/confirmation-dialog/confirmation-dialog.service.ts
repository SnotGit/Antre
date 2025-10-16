import { Injectable, signal } from '@angular/core';

export interface ConfirmationConfig {
  title: string;
  message: string;
  items?: string[];
  additionalInfo?: string;
  confirmText: string;
  cancelText: string;
  isDanger: boolean;
  isMessage?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationDialogService {
  private visible = signal(false);
  private dialogConfig = signal<ConfirmationConfig | null>(null);
  private resolvePromise: ((result: boolean) => void) | null = null;

  isVisible = this.visible.asReadonly();
  config = this.dialogConfig.asReadonly();

  //======= DIALOG CORE =======

  showDialog(config: ConfirmationConfig): Promise<boolean> {
    this.forceCloseDialog();

    return new Promise<boolean>((resolve) => {
      this.resolvePromise = resolve;
      this.dialogConfig.set(config);
      this.visible.set(true);
    });
  }

  showMessage(config: ConfirmationConfig): void {
    this.forceCloseDialog();
    
    this.dialogConfig.set(config);
    this.visible.set(true);
    
    setTimeout(() => {
      this.cleanup();
    }, 3000);
  }

  //======= USER ACTIONS =======

  onConfirm(): void {
    const config = this.dialogConfig();
    if (config?.isMessage) {
      this.cleanup();
    } else {
      this.closeDialog(true);
    }
  }

  onCancel(): void {
    const config = this.dialogConfig();
    if (config?.isMessage) {
      this.cleanup();
    } else {
      this.closeDialog(false);
    }
  }

  //======= CLEANUP =======

  private closeDialog(result: boolean): void {
    if (this.resolvePromise) {
      this.resolvePromise(result);
      this.resolvePromise = null;
    }

    this.cleanup();
  }

  private forceCloseDialog(): void {
    if (this.resolvePromise) {
      this.resolvePromise(false);
      this.resolvePromise = null;
    }
    
    this.cleanup();
  }

  private cleanup(): void {
    this.visible.set(false);
    this.dialogConfig.set(null);
  }
}