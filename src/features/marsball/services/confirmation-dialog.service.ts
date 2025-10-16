import { Injectable, inject } from '@angular/core';
import { ConfirmationDialogService as HubService, ConfirmationConfig } from '@shared/utilities/confirmation-dialog/confirmation-dialog.service';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationDialogService {

  //======= INJECTIONS =======

  private readonly hub = inject(HubService);

  //======= DELETE CATEGORY =======

  confirmDeleteCategory(names: string[]): Promise<boolean> {
    const isMultiple = names.length > 1;
    
    const config: ConfirmationConfig = {
      title: isMultiple ? 'Supprimer les catégories' : 'Supprimer la catégorie',
      message: isMultiple 
        ? 'Êtes-vous sûr de vouloir supprimer ?'
        : 'Êtes-vous sûr de vouloir supprimer ?',
      items: names,
      additionalInfo: 'Toutes les sous-catégories et items seront également supprimés.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      isDanger: true
    };

    return this.hub.showDialog(config);
  }

  //======= DELETE ITEM =======

  confirmDeleteItem(names: string[]): Promise<boolean> {
    const isMultiple = names.length > 1;
    
    const config: ConfirmationConfig = {
      title: isMultiple ? 'Supprimer les items' : 'Supprimer l\'item',
      message: isMultiple
        ? 'Êtes-vous sûr de vouloir supprimer ?'
        : 'Êtes-vous sûr de vouloir supprimer ?',
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