import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, ActivatedRoute, RouterModule, RouterLink } from '@angular/router';

@Component({
  selector: 'app-marsball',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink],
  templateUrl: './marsball.component.html',
  styleUrls: ['./marsball.component.css'],
})
export class MarsballComponent {
  constructor(private router: Router, private route: ActivatedRoute) {}

  isChildRoute(): boolean {
    return this.router.url.includes('bestiaire') || this.router.url.includes('rover');
  }
}