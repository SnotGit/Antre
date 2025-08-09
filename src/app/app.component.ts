import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../features/menus/components/navbar/navbar';
import { ConsoleV3 } from '../features/menus/components/console-v3/console-v3';
import { Terminal } from '../shared/utilities/terminal/terminal';
import { ConfirmationDialog } from '@shared/utilities/confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, ConsoleV3, Terminal, ConfirmationDialog],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
}
