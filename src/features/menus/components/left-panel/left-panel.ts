import { Component } from '@angular/core';
import { Terminal } from '@features/terminal/terminal';
import { Elena } from '@features/elena/components/elena';

@Component({
  selector: 'app-left-panel',
  imports: [Elena, Terminal],
  templateUrl: './left-panel.html',
  styleUrl: './left-panel.scss'
})
export class LeftPanel {}
