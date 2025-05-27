// story-detail.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { StoryService, StoryFromAPI, StoryByIdResponse } from '../../../services/story.service';

@Component({
  selector: 'app-story-detail',
  imports: [CommonModule],
  templateUrl: './story-detail.component.html',
  styleUrl: './story-detail.component.scss'
})
export class StoryDetailComponent implements OnInit {
  
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private storyService = inject(StoryService);

  // Signals pour l'état du composant
  story = signal<StoryFromAPI>({
    id: 0,
    title: '',
    content: '',
    status: 'DRAFT',
    createdAt: '',
    updatedAt: '',
    user: undefined
  });

  loading = signal<boolean>(false);
  error = signal<string | null>(null);
author: any;

  ngOnInit(): void {
    // Récupérer l'ID depuis l'URL
    const storyId = this.route.snapshot.paramMap.get('id');
    if (storyId) {
      this.loadStory(parseInt(storyId));
    } else {
      this.error.set('ID d\'histoire manquant');
    }
  }

  loadStory(id?: number): void {
    const storyId = id || parseInt(this.route.snapshot.paramMap.get('id') || '0');
    if (!storyId) {
      this.error.set('ID d\'histoire manquant');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // Appel API réel
    this.storyService.getStoryById(storyId).subscribe({
      next: (response: StoryByIdResponse) => {
        if (response.story) {
          this.story.set(response.story);
        } else {
          this.error.set('Histoire non trouvée');
        }
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 404) {
          this.error.set('Histoire non trouvée');
        } else {
          this.error.set('Erreur lors du chargement de l\'histoire');
        }
        this.loading.set(false);
      }
    });
  }

  // Navigation
  goBack(): void {
    this.location.back();
  }

  // Méthodes utilitaires pour le template
  getFormattedDate(): string {
    const story = this.story();
    const dateToFormat = story.publishedAt || story.updatedAt || story.createdAt;
    
    if (!dateToFormat) return '';
    
    return new Date(dateToFormat).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getLikesCount(): number {
    // TODO: Récupérer le nombre de likes de CETTE histoire depuis l'API
    // Pour l'instant, valeur simulée
    return 23;
  }

  // Méthodes pour la navigation uniquement
  navigateToAuthor(): void {
    const authorUsername = this.story().user?.username;
    if (authorUsername) {
      this.router.navigate(['/chroniques/author', authorUsername]);
    }
  }
}