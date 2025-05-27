// story-detail.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { StoryService, StoryFromAPI, StoryByIdResponse } from '../../../services/story.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-story-detail',
  imports: [CommonModule],
  templateUrl: './story-detail.component.html',
  styleUrl: './story-detail.component.scss'
})
export class StoryDetailComponent implements OnInit {
  
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private storyService = inject(StoryService);
  private authService = inject(AuthService);

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

  // Signals pour les likes
  isLiked = signal<boolean>(false);
  likesCount = signal<number>(0);
  showConnectionBanner = signal<boolean>(false);

  ngOnInit(): void {
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

    this.storyService.getStoryById(storyId).subscribe({
      next: (response: StoryByIdResponse) => {
        if (response.story) {
          this.story.set(response.story);
          this.likesCount.set(23); // Valeur temporaire
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

  // Navigation entre histoires du même auteur
  hasPreviousStory(): boolean {
    return true; // Temporaire pour test
  }

  hasNextStory(): boolean {
    return true; // Temporaire pour test
  }

  goToPreviousStory(): void {
    console.log('Navigation vers histoire précédente');
    // TODO: Logique de navigation
  }

  goToNextStory(): void {
    console.log('Navigation vers histoire suivante');
    // TODO: Logique de navigation
  }

  // Formatage de la date
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

  // Système de likes
  showConnectionRequired(): boolean {
    return this.showConnectionBanner();
  }

  isOwnStory(): boolean {
    const currentUser = this.authService.currentUser();
    const storyUser = this.story().user;
    return currentUser?.id === storyUser?.id;
  }

  toggleLike(): void {
    if (!this.authService.isLoggedIn()) {
      this.showConnectionBanner.set(true);
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 2000);
      return;
    }

    if (this.isOwnStory()) {
      return;
    }

    // Simulation temporaire
    this.isLiked.set(!this.isLiked());
    if (this.isLiked()) {
      this.likesCount.set(this.likesCount() + 1);
    } else {
      this.likesCount.set(this.likesCount() - 1);
    }
  }

  getLikesCount(): number {
    return this.likesCount();
  }
}