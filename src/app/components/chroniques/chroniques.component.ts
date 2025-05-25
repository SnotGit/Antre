// chroniques.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChroniquesService } from '../../services/chroniques.service';

@Component({
  selector: 'app-chroniques',
  imports: [CommonModule],
  templateUrl: './chroniques.component.html',
  styleUrl: './chroniques.component.scss'
})
export class ChroniquesComponent implements OnInit {

  private router = inject(Router);
  private chroniquesService = inject(ChroniquesService);

  // Signals depuis le service
  recentAuthors = this.chroniquesService.recentAuthors;
  loading = this.chroniquesService.loading;
  error = this.chroniquesService.error;

  ngOnInit(): void {
    // Les données se chargent automatiquement via le service constructor
    // Optionnel: forcer le refresh si nécessaire
    // this.chroniquesService.refresh();
  }

  navigateToStory(authorUsername: string, storySlug: string): void {
    this.router.navigate(['/chroniques', authorUsername, storySlug]);
  }

  // Méthode pour rafraîchir manuellement
  refreshAuthors(): void {
    this.chroniquesService.refresh();
  }
}