import { Component, inject } from '@angular/core';
import { DialogCardService } from '../../services/dialog/dialog-card.service';
import { DialogCard } from '../dialog-card/dialog-card';

@Component({
  selector: 'app-dialog-card-overlay',
  imports: [DialogCard],
  templateUrl: './dialog-card-overlay.html',
  styleUrl: './dialog-card-overlay.scss'
})
export class DialogCardOverlay {

  //======= INJECTIONS =======

  protected dialogCard = inject(DialogCardService);
}
