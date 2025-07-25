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

  confirmCancelChanges(): Promise<boolean> {
    const config: ConfirmationConfig = {
      title: 'Annuler les modifications',
      message: 'Voulez-vous vraiment quitter sans sauvegarder vos modifications ?',
      confirmText: 'Quitter',
      cancelText: 'Continuer l\'édition',
      isDanger: true
    };

    return this.showDialog(config);
  }

  private showDialog(config: ConfirmationConfig): Promise<boolean> {
    return new Promise((resolve) => {
      this.resolvePromise = resolve;
      this.dialogConfig.set(config);
      this.visible.set(true);
    });
  }

  onConfirm(): void {
    this.closeDialog(true);
  }

  onCancel(): void {
    this.closeDialog(false);
  }

  private closeDialog(result: boolean): void {
    this.visible.set(false);
    this.dialogConfig.set(null);
    if (this.resolvePromise) {
      this.resolvePromise(result);
      this.resolvePromise = null;
    }
  }
}