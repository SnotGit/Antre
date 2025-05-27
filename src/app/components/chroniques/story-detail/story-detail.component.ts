// story-detail.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { StoryService, StoryFromAPI, StoryByIdResponse, LikeResponse } from '../../../services/story.service';
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

  // Nouveaux signals pour la navigation
  authorStories = signal<StoryFromAPI[]>([]);
  currentStoryIndex = signal<number>(-1);

  ngOnInit(): void {
    // Écouter les changements de paramètres de route
    this.route.params.subscribe(params => {
      const storyId = params['id'];
      if (storyId) {
        this.loadStory(parseInt(storyId));
      } else {
        this.error.set('ID d\'histoire manquant');
      }
    });
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
          
          // Charger les autres histoires de l'auteur pour la navigation
          if (response.story.user?.id) {
            this.loadAuthorStories(response.story.user.id);
          }

          // Charger le statut des likes
          this.loadLikeStatus();
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

  // Nouvelle méthode pour charger les histoires de l'auteur
  private loadAuthorStories(authorId: number): void {
    this.storyService.getStoriesByAuthor(authorId).subscribe({
      next: (response) => {
        if (response.stories) {
          // Filtrer seulement les histoires publiées et trier par DATE CROISSANTE (plus ancien vers plus récent)
          const publishedStories = response.stories
            .filter(story => story.status === 'PUBLISHED' && story.publishedAt)
            .sort((a, b) => new Date(a.publishedAt!).getTime() - new Date(b.publishedAt!).getTime());
          
          this.authorStories.set(publishedStories);
          
          // Trouver l'index de l'histoire actuelle DANS CE TRI PAR DATE
          const currentId = this.story().id;
          const index = publishedStories.findIndex(story => story.id === currentId);
          this.currentStoryIndex.set(index);
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des histoires de l\'auteur:', error);
      }
    });
  }

  // Navigation entre histoires du même auteur - NOUVELLES MÉTHODES
  hasPreviousStory(): boolean {
    return this.currentStoryIndex() > 0;
  }

  hasNextStory(): boolean {
    const stories = this.authorStories();
    const currentIndex = this.currentStoryIndex();
    return currentIndex >= 0 && currentIndex < stories.length - 1;
  }

  goToPreviousStory(): void {
    if (this.hasPreviousStory()) {
      const stories = this.authorStories();
      const newIndex = this.currentStoryIndex() - 1;
      const previousStory = stories[newIndex];
      
      if (previousStory) {
        this.router.navigate(['/chroniques/story', previousStory.id]);
      }
    }
  }

  goToNextStory(): void {
    if (this.hasNextStory()) {
      const stories = this.authorStories();
      const newIndex = this.currentStoryIndex() + 1;
      const nextStory = stories[newIndex];
      
      if (nextStory) {
        this.router.navigate(['/chroniques/story', nextStory.id]);
      }
    }
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

  // Système de likes - VRAIE LOGIQUE
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
        this.showConnectionBanner.set(false);
      }, 3000);
      return;
    }

    if (this.isOwnStory()) {
      return;
    }

    // VRAIE LOGIQUE avec API
    const token = this.authService.getToken();
    const storyId = this.story().id;
    
    if (!token || !storyId) return;

    this.storyService.toggleLike(storyId, token).subscribe({
      next: (response) => {
        this.isLiked.set(response.isLiked);
        this.likesCount.set(response.likesCount);
      },
      error: (error) => {
        console.error('Erreur lors du like:', error);
      }
    });
  }

  getLikesCount(): number {
    return this.likesCount();
  }

  // Charger le statut initial des likes
  private loadLikeStatus(): void {
    if (!this.authService.isLoggedIn()) {
      // Si pas connecté, charger juste le nombre total de likes (public)
      this.likesCount.set(0); // Temporaire - à remplacer par un appel API public
      return;
    }
    
    const token = this.authService.getToken();
    const storyId = this.story().id;
    
    if (!token || !storyId) return;

    this.storyService.checkIfLiked(storyId, token).subscribe({
      next: (response) => {
        this.isLiked.set(response.isLiked);
        this.likesCount.set(response.likesCount);
      },
      error: (error) => {
        console.error('Erreur lors du chargement du statut like:', error);
        // Garder les valeurs par défaut
        this.likesCount.set(0);
      }
    });
  }

  // Navigation vers le profil de l'auteur
  goToAuthorProfile(): void {
    const authorId = this.story().user?.id;
    if (authorId) {
      this.router.navigate(['/chroniques/author', authorId]);
    }
  }
}