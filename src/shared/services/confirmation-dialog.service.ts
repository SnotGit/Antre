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

  //============ DELETE STORY ============

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

  //============ DELETE MULTIPLE ============

  confirmDeleteMultiple(count: number): Promise<boolean> {
    const config: ConfirmationConfig = {
      title: 'Suppression multiple',
      message: `Êtes-vous sûr de vouloir supprimer ${count} histoire${count > 1 ? 's' : ''} ?`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      isDanger: true
    };

    return this.showDialog(config);
  }

  //============ PUBLISH STORY ============

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

  //============ DIALOG CORE ============

  private showDialog(config: ConfirmationConfig): Promise<boolean> {
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

  //============ CLEANUP ============

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