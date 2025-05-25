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
    views: 0,
    wordCount: 0,
    createdAt: '',
    updatedAt: '',
    user: undefined
  });

  loading = signal<boolean>(false);
  error = signal<string | null>(null);

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
          
          // Incrémenter les vues si l'histoire est publiée
          if (response.story.status === 'PUBLISHED') {
            this.storyService.incrementViews(storyId).subscribe({
              next: () => {
                // Vue incrémentée avec succès
                const updatedStory = { ...this.story(), views: this.story().views + 1 };
                this.story.set(updatedStory);
              },
              error: (error: HttpErrorResponse) => {
                console.error('Erreur lors de l\'incrémentation des vues:', error);
                // Pas grave si ça échoue, on continue
              }
            });
          }
        } else {
          this.error.set('Histoire non trouvée');
        }
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur lors du chargement de l\'histoire:', error);
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
  isPublished(): boolean {
    return this.story().status === 'PUBLISHED';
  }

  getStatus(): string {
    const status = this.story().status;
    switch (status) {
      case 'DRAFT': return 'Brouillon';
      case 'PUBLISHED': return 'Publié';
      case 'ARCHIVED': return 'Archivé';
      default: return 'Inconnu';
    }
  }

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

  getTotalStories(): number {
    // TODO: Récupérer le nombre total d'histoires de l'auteur depuis l'API
    // Pour l'instant, on retourne une valeur par défaut
    return 7;
  }

  getLikesCount(): number {
    // TODO: Récupérer le nombre de likes depuis l'API
    // Pour l'instant, valeur simulée
    return 23;
  }

  // Méthodes pour les actions (seront déplacées vers le console-panel)
  editStory(): void {
    this.router.navigate(['/chroniques/editor', this.story().id]);
  }

  deleteStory(): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette histoire ?')) {
      // TODO: Implémenter la suppression
      console.log('Supprimer histoire ID:', this.story().id);
    }
  }

  publishStory(): void {
    // TODO: Implémenter la publication
    console.log('Publier histoire ID:', this.story().id);
  }
}