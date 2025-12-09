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

  //======= SAVE OR QUIT =======

  confirmSaveOrQuit(): Promise<boolean> {
    const config: ConfirmationConfig = {
      title: 'Quitter sans sauvegarder ?',
      message: 'Sauvegarder en brouillon ?',
      confirmText: 'Sauvegarder',
      cancelText: 'Quitter',
      isDanger: true
    };

    return this.showDialog(config);
  }

  //======= CANCEL STORY =======

  confirmCancelStory(): Promise<boolean> {
    const config: ConfirmationConfig = {
      title: 'Annuler la création',
      message: 'Êtes-vous sûr de vouloir annuler la création de cette histoire ?\n\nToutes les modifications seront perdues.',
      confirmText: 'Annuler',
      cancelText: 'Continuer',
      isDanger: true
    };

    return this.showDialog(config);
  }

  //======= DELETE STORY =======

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

  //======= DELETE MULTIPLE =======

  confirmDeleteSelection(count: number): Promise<boolean> {
    const config: ConfirmationConfig = {
      title: 'Suppression',
      message: `Êtes-vous sûr de vouloir supprimer ${count} histoire${count > 1 ? 's' : ''} ?`,
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
      message: 'Votre histoire a été publiée !',
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