import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./core/navbar/navbar/navbar.component";
import { ConsolePanelComponent } from "./core/navbar/console-panel/console-panel/console-panel.component";
import { ConsoleTerminalComponent } from "./core/navbar/console-panel/console-terminal/console-terminal.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, ConsolePanelComponent, ConsoleTerminalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'antre';
}
