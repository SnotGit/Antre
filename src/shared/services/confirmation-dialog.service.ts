import { Injectable, signal } from '@angular/core';

interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  isDanger: boolean;
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

  //============ PROMISES ROBUSTES ============

  confirmDeleteStory(isNewStory: boolean): Promise<boolean> {
    const config: ConfirmationConfig = {
      title: isNewStory ? 'Annuler la création' : 'Suppression du brouillon',
      message: isNewStory 
        ? 'Êtes-vous sûr de vouloir annuler la création de cette histoire ?'
        : 'Êtes-vous sûr de vouloir supprimer ce brouillon ?',
      confirmText: isNewStory ? 'Annuler' : 'Supprimer',
      cancelText: 'Retour',
      isDanger: true
    };

    return this.showDialog(config);
  }

  confirmPublishStory(): Promise<boolean> {
    const config: ConfirmationConfig = {
      title: 'Publier l\'histoire',
      message: 'Êtes-vous sûr de vouloir publier cette histoire ?',
      confirmText: 'Publier',
      cancelText: 'Annuler',
      isDanger: false
    };

    return this.showDialog(config);
  }

  //============ CORE DIALOG LOGIC ============

  private showDialog(config: ConfirmationConfig): Promise<boolean> {
    // Cleanup any previous dialog
    this.forceCloseDialog();

    return new Promise<boolean>((resolve) => {
      this.resolvePromise = resolve;
      this.dialogConfig.set(config);
      this.visible.set(true);
    });
  }

  //============ USER ACTIONS ============

  onConfirm(): void {
    this.closeDialog(true);
  }

  onCancel(): void {
    this.closeDialog(false);
  }

  //============ CLEANUP LOGIC ============

  private closeDialog(result: boolean): void {
    // Always resolve the Promise first
    if (this.resolvePromise) {
      this.resolvePromise(result);
      this.resolvePromise = null;
    }

    // Then cleanup the UI
    this.cleanup();
  }

  private forceCloseDialog(): void {
    // Resolve any pending Promise with false
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