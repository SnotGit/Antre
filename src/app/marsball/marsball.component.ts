import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-marsball',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink],
  templateUrl: './marsball.component.html',
  styleUrls: ['./marsball.component.css']
})
export class MarsballComponent {}