import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-bestiaire',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink],
  templateUrl: './bestiaire.component.html',
  styleUrls: ['./bestiaire.component.css']
})

export class BestiaireComponent {}