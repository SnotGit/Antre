import { Injectable, inject } from '@angular/core';
import { ConfirmationDialogService, ConfirmationConfig } from './confirmation-dialog.service';

@Injectable({
  providedIn: 'root'
})
export class AdminDialogService {

  //======= INJECTIONS =======

  private readonly hub = inject(ConfirmationDialogService);

  //======= DELETE CONFIRMATION =======

  confirmDelete(names: string[]): Promise<boolean> {
    const isMultiple = names.length > 1;
    
    const config: ConfirmationConfig = {
      title: 'Suppression',
      message: isMultiple 
        ? 'Êtes-vous sûr de vouloir supprimer les éléments sélectionnés ?'
        : 'Êtes-vous sûr de vouloir supprimer l\'élément sélectionné ?',
      items: names,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      isDanger: true
    };

    return this.hub.showDialog(config);
  }

  //======= SUCCESS MESSAGE =======

  showSuccessMessage(): void {
    const config: ConfirmationConfig = {
      title: 'Opération Réussie',
      message: 'Opération effectuée avec succès !',
      confirmText: 'OK',
      cancelText: '',
      isDanger: false,
      isMessage: true
    };

    this.hub.showMessage(config);
  }

  //======= ERROR MESSAGE =======

  showErrorMessage(): void {
    const config: ConfirmationConfig = {
      title: 'Opération Corrompue',
      message: 'Une erreur est survenue',
      confirmText: 'OK',
      cancelText: '',
      isDanger: true,
      isMessage: true
    };

    this.hub.showMessage(config);
  }
}