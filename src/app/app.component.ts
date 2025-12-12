import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../features/menus/components/navbar/navbar';
import { ConsoleV3 } from '../features/menus/components/console-v3/console-v3';
import { Terminal } from '../features/menus/components/terminal/terminal';
import { ConfirmationDialog } from '@shared/components/confirmation-dialog/confirmation-dialog';
import { CreateCategory } from '@shared/components/create-category/create-category';
import { NewMarsballItem } from '@features/marsball/components/new-marsball-item/new-marsball-item';
import { NewBestiaireCreature } from '@features/marsball/bestiaire/components/new-bestiaire-creature/new-bestiaire-creature';
import { NewRoverItem } from '@features/marsball/rover/components/new-rover-item/new-rover-item';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, ConsoleV3, Terminal, ConfirmationDialog, CreateCategory, NewMarsballItem, NewBestiaireCreature, NewRoverItem],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
}