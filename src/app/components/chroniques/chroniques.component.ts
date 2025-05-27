import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChroniquesService } from '../../services/chroniques.service';
import { StoryCardComponent } from './shared/story-card/story-card.component';

@Component({
  selector: 'app-chroniques',
  imports: [CommonModule, StoryCardComponent],
  templateUrl: './chroniques.component.html',
  styleUrl: './chroniques.component.scss'
})
export class ChroniquesComponent implements OnInit {

  private router = inject(Router);
  private chroniquesService = inject(ChroniquesService);

  // Signals depuis le service
  recentAuthors = this.chroniquesService.recentAuthors;
  loading = this.chroniquesService.loading;

  // Test story pour notre nouveau composant
  testStory = computed(() => {
    const authors = this.recentAuthors();
    if (authors.length > 0) {
      const author = authors[0];
      return {
        id: author.latestStory.id,
        title: author.latestStory.title,
        user: {
          id: author.id,
          username: author.username,
          description: author.description,
          avatar: author.avatar
        }
      };
    }
    return null;
  });

  ngOnInit(): void {
    // Les données se chargent automatiquement via le service constructor
    // Optionnel: forcer le refresh si nécessaire
    // this.chroniquesService.refresh();
  }

  navigateToStory(storyId: number): void {
    this.router.navigate(['/chroniques/story', storyId]);
  }

  // Méthode pour rafraîchir manuellement
  refreshAuthors(): void {
    this.chroniquesService.refresh();
  }
}