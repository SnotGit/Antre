import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navigation/navbar/navbar';
import { ConsoleV3 } from './components/navigation/console-v3/console-v3';
import { Terminal } from './components/navigation/terminal/terminal';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, ConsoleV3, Terminal],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
}
