import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-bestiaire',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bestiaire.component.html',
  styleUrls: ['./bestiaire.component.css'],
})
export class BestiaireComponent {
  constructor(private router: Router) {}

  isChildRoute(route: string): boolean {
    return this.router.url.includes(route);
  }
}