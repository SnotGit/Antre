import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../features/menus/components/navbar/navbar';
import { ConsoleV3 } from '../features/menus/components/console-v3/console-v3';
import { Terminal } from '../features/menus/components/terminal/terminal';
import { ConfirmationDialog } from '@shared/utilities/confirmation-dialog/confirmation-dialog';
import { NewMarsballCategory } from '@features/marsball/components/new-marsball-category/new-marsball-category';
import { NewMarsballItem } from '@features/marsball/components/new-marsball-item/new-marsball-item';
import { NewBestiaireCreature } from '@features/marsball/bestiaire/components/new-bestiaire-creature/new-bestiaire-creature';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, ConsoleV3, Terminal, ConfirmationDialog, NewMarsballCategory, NewMarsballItem, NewBestiaireCreature],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
}