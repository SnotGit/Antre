import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./components/navbar/navbar/navbar.component";
import { ConsolePanelComponent } from "./components/navbar/console-panel/console-panel/console-panel.component";
import { ConsoleTerminalComponent } from "./components/navbar/console-panel/console-terminal/console-terminal.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, ConsolePanelComponent, ConsoleTerminalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'antre';
}
