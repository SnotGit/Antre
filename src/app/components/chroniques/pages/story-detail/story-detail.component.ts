import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { StoryService, StoryFromAPI } from '../../../../services/story.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-story-detail',
  imports: [CommonModule],
  templateUrl: './story-detail.component.html',
  styleUrl: './story-detail.component.scss'
})
export class StoryDetailComponent implements OnInit, OnDestroy {
  
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private storyService = inject(StoryService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  //============ SIGNALS ============
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

  //============ SIGNALS LIKES ============
  isLiked = signal<boolean>(false);
  likesCount = signal<number>(0);

  //============ SIGNALS NAVIGATION ============
  authorStories = signal<StoryFromAPI[]>([]);
  currentStoryIndex = signal<number>(-1);

  //============ COMPUTED SIGNALS ============
  currentUser = this.authService.currentUser;
  isUserLoggedIn = computed(() => this.authService.isLoggedIn());

  avatarUrl = computed(() => {
    const avatar = this.story().user?.avatar;
    return avatar ? `http://localhost:3000${avatar}` : null;
  });

  isCurrentUserStory = computed(() => {
    const currentUser = this.currentUser();
    const storyUser = this.story().user;
    return currentUser?.id === storyUser?.id;
  });

  formattedDate = computed(() => {
    const story = this.story();
    const dateToFormat = story.publishedAt || story.updatedAt || story.createdAt;
    
    if (!dateToFormat) return '';
    
    return new Date(dateToFormat).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  });

  //============ EFFECT POUR CHARGER LES HISTOIRES DE L'AUTEUR ============
  private loadAuthorStoriesEffect = effect(() => {
    const userId = this.story().user?.id;
    if (userId && userId > 0) {
      this.loadAuthorStories(userId);
    }
  });

  //============ LIFECYCLE ============
  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadStory(parseInt(id));
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  //============ MÉTHODES DE CHARGEMENT ============
  loadStory(id?: number): void {
    const storyId = id || parseInt(this.route.snapshot.paramMap.get('id') || '0');
    if (!storyId) {
      this.error.set('ID d\'histoire manquant');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.storyService.getStoryById(storyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.story) {
            this.story.set(response.story);
            this.loadLikeStatus();
          } else {
            this.error.set('Histoire non trouvée');
          }
          this.loading.set(false);
        },
        error: (error) => {
          if (error.status === 404) {
            this.error.set('Histoire non trouvée');
          } else {
            this.error.set('Erreur lors du chargement de l\'histoire');
          }
          this.loading.set(false);
        }
      });
  }

  private loadAuthorStories(authorId: number): void {
    this.storyService.getStoriesByAuthor(authorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.stories) {
            const publishedStories = response.stories
              .filter(story => story.status === 'PUBLISHED' && story.publishedAt)
              .sort((a, b) => new Date(a.publishedAt!).getTime() - new Date(b.publishedAt!).getTime());
            
            this.authorStories.set(publishedStories);
            
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

  private loadLikeStatus(): void {
    const storyId = this.story().id;
    
    if (!storyId) return;

    if (!this.isUserLoggedIn()) {
      this.isLiked.set(false);
      this.likesCount.set(0);
      return;
    }
    
    const token = this.authService.getToken();
    if (!token) return;

    this.storyService.checkIfLiked(storyId, token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLiked.set(response.isLiked);
          this.likesCount.set(response.likesCount);
        },
        error: (error) => {
          console.error('Erreur lors du chargement du statut like:', error);
          this.isLiked.set(false);
          this.likesCount.set(0);
        }
      });
  }

  //============ MÉTHODES PUBLIQUES ============
  toggleLike(): void {
    if (!this.isUserLoggedIn() || this.isCurrentUserStory()) {
      return;
    }

    const token = this.authService.getToken();
    const storyId = this.story().id;
    
    if (!token || !storyId) return;

    this.storyService.toggleLike(storyId, token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLiked.set(response.isLiked);
          this.likesCount.set(response.likesCount);
        },
        error: (error) => {
          console.error('Erreur lors du like:', error);
        }
      });
  }

  //============ NAVIGATION ============
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

  //============ MÉTHODES UTILITAIRES ============
  isOwnStory(): boolean {
    return this.isCurrentUserStory();
  }

  getLikesCount(): number {
    return this.likesCount();
  }

  getAvatarUrl(): string | null {
    return this.avatarUrl();
  }
  
  hasAvatar(): boolean {
    return this.avatarUrl() !== null;
  }

  goToAuthorProfile(): void {
    const authorId = this.story().user?.id;
    if (authorId) {
      this.router.navigate(['/chroniques/author', authorId]);
    }
  }
}