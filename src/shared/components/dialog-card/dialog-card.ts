import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-dialog-card',
  imports: [],
  templateUrl: './dialog-card.html',
  styleUrl: './dialog-card.scss'
})
export class DialogCard {

  //========== INPUTS ==========//

  title = input.required<string>();
  message = input.required<string>();
  items = input<string[]>([]);
  additionalInfo = input('');
  confirmText = input('Confirmer');
  cancelText = input('Annuler');
  isDanger = input(false);
  isMessage = input(false);

  //========== OUTPUTS ==========//

  confirm = output<void>();
  cancel = output<void>();
}
