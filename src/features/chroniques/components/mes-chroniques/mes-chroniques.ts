import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-mes-chroniques',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './mes-chroniques.html',
  styleUrl: './mes-chroniques.scss'
})
export class MesChroniques {}
