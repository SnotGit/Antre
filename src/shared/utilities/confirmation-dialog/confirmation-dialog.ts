import { Component, inject } from '@angular/core';
import { ConfirmationDialogService } from './confirmation-dialog.service';

@Component({
  selector: 'app-confirmation-dialog',
  imports: [],
  templateUrl: './confirmation-dialog.html',
  styleUrl: './confirmation-dialog.scss'
})
export class ConfirmationDialog {

  //======= INJECTIONS =======
  
  protected confirmationService = inject(ConfirmationDialogService);
}