import { Injectable, signal } from '@angular/core';

interface ConfirmationConfig {
  title: string;
  message: string;
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

  //======= DELETE CATEGORY =======

  confirmDeleteCategory(): Promise<boolean> {
    const config: ConfirmationConfig = {
      title: 'Supprimer la catégorie',
      message: 'Êtes-vous sûr de vouloir supprimer cette catégorie ?\n\nToutes les sous-catégories et items seront également supprimés.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      isDanger: true
    };

    return this.showDialog(config);
  }

  //======= DELETE ITEM =======

  confirmDeleteItem(): Promise<boolean> {
    const config: ConfirmationConfig = {
      title: 'Supprimer l\'item',
      message: 'Êtes-vous sûr de vouloir supprimer cet item ?',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      isDanger: true
    };

    return this.showDialog(config);
  }

  //======= SUCCESS MESSAGES =======

  showSuccessMessage(): void {
    const config: ConfirmationConfig = {
      title: 'Opération Réussie',
      message: 'Opération effectuée avec succès !',
      confirmText: 'OK',
      cancelText: '',
      isDanger: false,
      isMessage: true
    };

    this.showMessage(config);
  }

  //======= ERROR MESSAGES =======

  showErrorMessage(): void {
    const config: ConfirmationConfig = {
      title: 'Opération Corrompue',
      message: 'Une erreur est survenue',
      confirmText: 'OK',
      cancelText: '',
      isDanger: true,
      isMessage: true
    };

    this.showMessage(config);
  }

  //======= DIALOG CORE =======

  private showDialog(config: ConfirmationConfig): Promise<boolean> {
    this.forceCloseDialog();

    return new Promise<boolean>((resolve) => {
      this.resolvePromise = resolve;
      this.dialogConfig.set(config);
      this.visible.set(true);
    });
  }

  private showMessage(config: ConfirmationConfig): void {
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