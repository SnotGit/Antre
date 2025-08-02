import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationDialogService } from '../../../services/confirmation-dialog.service';

@Component({
  selector: 'app-confirmation-dialog',
  imports: [CommonModule],
  templateUrl: './confirmation-dialog.html',
  styleUrl: './confirmation-dialog.scss'
})
export class ConfirmationDialog {
  protected confirmationService = inject(ConfirmationDialogService);
}