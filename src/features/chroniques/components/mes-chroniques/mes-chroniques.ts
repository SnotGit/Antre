import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-mes-chroniques',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './mes-chroniques.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './mes-chroniques.scss'
})
export class MesChroniques {}
